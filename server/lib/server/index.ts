import { Hono } from "hono";
import { validator } from "hono/validator";
import { serve } from "@hono/node-server";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { createLibp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import { identify } from "@libp2p/identify";
import { mdns } from "@libp2p/mdns";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import {
  MetadataSchema,
  type CompanionCard,
  type Metadata,
} from "../../schema/index.ts";
import { CompanionAgent } from "../agents/index.ts";
import { MessageSchema, ContextSchema } from "../../schema/index.ts";
import { logger } from "hono/logger";
import { cors } from "hono/cors";

export interface ICompanionServer {
  companionAgent: CompanionAgent;
  companion: CompanionCard;
  libp2p: Awaited<ReturnType<typeof initLibp2p>>;
  app: Hono;
  port: number;
  companionList: Map<string, Metadata>;

  start(): Promise<void>;
}

export const initLibp2p = async () => {
  return await createLibp2p({
    addresses: { listen: ["/ip4/0.0.0.0/tcp/0"] },
    transports: [tcp()],
    peerDiscovery: [mdns()], //mdnsでピア探索(ローカル限定)
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    services: {
      pubsub: gossipsub({ allowPublishToZeroTopicPeers: true }),
      identify: identify(),
    },
  });
};

export class CompanionServer implements ICompanionServer {
  companionAgent: CompanionAgent;
  companion: CompanionCard;
  libp2p!: Awaited<ReturnType<typeof initLibp2p>>;
  app: Hono;
  port: number;
  companionList = new Map<string, Metadata>();

  constructor(companionAgent: CompanionAgent, port: number) {
    this.companionAgent = companionAgent;
    this.companion = companionAgent.companion;
    this.app = new Hono();
    this.port = port;
  }

  private async initLibp2p() {
    const libp2p = await initLibp2p();

    //ピア(Companion)を発見したら接続
    libp2p.addEventListener("peer:discovery", (evt) => {
      this.libp2p.dial(evt.detail.multiaddrs);
    });

    //各topicのサブスクライブ
    libp2p.services.pubsub.subscribe("actions");
    libp2p.services.pubsub.subscribe("contexts");
    libp2p.services.pubsub.subscribe("metadata"); // Metadataを受信するためのトピック

    //イベントハンドラの設定
    libp2p.services.pubsub.addEventListener("message", (evt) =>
      this.handlePubSubMessage(evt),
    );

    // ピアの接続イベントを処理（Metadataをブロードキャスト）
    libp2p.addEventListener("peer:connect", async (evt) => {
      try {
        console.log(`Peer connected: ${evt.detail.toString()}`);
        // 自分のMetadataをブロードキャスト
        const metadataMsg = JSON.stringify(this.companion.metadata);
        await libp2p.services.pubsub.publish(
          "metadata",
          new TextEncoder().encode(metadataMsg),
        );
      } catch (e) {
        console.error("Error during peer connection:", e);
      }
    });

    // ピアの切断イベントを処理
    libp2p.addEventListener("peer:disconnect", async (evt) => {
      try {
        const peerIdStr = evt.detail.toString();
        const agentVersion = this.companionList.get(peerIdStr);
        if (!this.companionList.has(peerIdStr)) return;
        console.log(
          `Peer disconnected: ${peerIdStr}, metadata was:`,
          agentVersion,
        );
        this.companionList.delete(peerIdStr);
      } catch (e) {
        console.error(e);
      }
    });

    //tool呼び出しのためRuntimeContextにSet
    this.companionAgent.runtimeContext.set("libp2p", libp2p);
    this.companionAgent.runtimeContext.set("companions", this.companionList);

    this.libp2p = libp2p;
  }

  private async handlePubSubMessage(message: any) {
    // 話題を取得
    const topic = message.detail.topic;
    const fromPeerId = message.detail.from.toString();

    try {
      const data = JSON.parse(new TextDecoder().decode(message.detail.data));
      if (topic === "contexts") {
        const parsed = ContextSchema.safeParse(data);
        if (!parsed.success) return;
        const body = parsed.data;
        await this.companionAgent.addContext(body.context);
      } else if (topic === "metadata") {
        const parsed = MetadataSchema.safeParse(data);
        if (!parsed.success) return;

        // 自分のメッセージは無視
        if (fromPeerId === this.libp2p.peerId.toString()) return;

        // 既に登録済みの場合は無視
        if (this.companionList.has(fromPeerId)) return;

        this.companionList.set(fromPeerId, parsed.data);
        console.log(`Added peer ${fromPeerId} with metadata:`, parsed.data);
      }
    } catch (err) {
      console.error("Error processing pubsub message:", err);
    }
  }

  private setupRoutes() {
    this.app.use(logger());
    this.app.use("*", cors());

    this.app.post(
      "/generate",
      validator("json", (value, c) => {
        const parsed = MessageSchema.omit({ to: true }).safeParse(value);
        if (!parsed.success) return c.text("Invalid Body!", 400);
        return parsed.data;
      }),
      async (c) => {
        const body = c.req.valid("json");
        const message = await this.companionAgent.generateMessage(body);
        return c.json(message, 200);
      },
    );

    this.app.post(
      "/context",
      validator("json", (value, c) => {
        const parsed = ContextSchema.safeParse(value);
        if (!parsed.success) return c.text("Invalid Body!", 400);
        return parsed.data;
      }),
      async (c) => {
        const body = c.req.valid("json");
        await this.companionAgent.addContext(body.context);
        return c.json({ message: "Added context successfully" }, 201);
      },
    );
  }

  //サーバーを起動
  async start() {
    await this.initLibp2p();
    this.setupRoutes();

    serve({ fetch: this.app.fetch, port: this.port });
    console.log(`Character server running on http://localhost:${this.port}`);
  }
}
