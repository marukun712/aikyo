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
  companionList: Map<string, string>;

  start(): Promise<void>;
}

export const initLibp2p = async (metadata: Metadata) => {
  return await createLibp2p({
    addresses: { listen: ["/ip4/0.0.0.0/tcp/0"] },
    transports: [tcp()],
    peerDiscovery: [mdns()], //mdnsでピア探索(ローカル限定)
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    services: {
      pubsub: gossipsub({ allowPublishToZeroTopicPeers: true }),
      identify: identify({
        agentVersion: JSON.stringify(metadata, null, 2),
      }),
    },
  });
};

export class CompanionServer implements ICompanionServer {
  companionAgent: CompanionAgent;
  companion: CompanionCard;
  libp2p!: Awaited<ReturnType<typeof initLibp2p>>;
  app: Hono;
  port: number;
  companionList = new Map<string, string>();

  constructor(companionAgent: CompanionAgent, port: number) {
    this.companionAgent = companionAgent;
    this.companion = companionAgent.companion;
    this.app = new Hono();
    this.port = port;
  }

  private async initLibp2p() {
    const libp2p = await initLibp2p(this.companion.metadata);

    //ピア(Companion)を発見したら接続
    libp2p.addEventListener("peer:discovery", (evt) => {
      this.libp2p.dial(evt.detail.multiaddrs);
    });

    //各topicのサブスクライブ
    libp2p.services.pubsub.subscribe("actions");
    libp2p.services.pubsub.subscribe("contexts");

    //イベントハンドラの設定
    libp2p.services.pubsub.addEventListener("message", (evt) =>
      this.handlePubSubMessage(evt),
    );

    libp2p.addEventListener("peer:identify", async (evt) => {
      try {
        const { agentVersion, peerId } = evt.detail;
        if (!agentVersion) return;
        const parsed = MetadataSchema.safeParse(JSON.parse(agentVersion));
        if (this.companionList.has(peerId.toString()) || !parsed.success)
          return;
        this.companionList.set(peerId.toString(), agentVersion);
        console.log(
          `Identified peer ${peerId.toString()} with metadata:`,
          agentVersion,
        );
      } catch (e) {}
    });

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
      } catch (e) {}
    });

    //tool呼び出しのためRuntimeContextにSet
    this.companionAgent.runtimeContext.set("libp2p", libp2p);
    this.companionAgent.runtimeContext.set("companions", this.companionList);

    this.libp2p = libp2p;
  }

  private async handlePubSubMessage(message: any) {
    const topic = message.detail.topic;

    try {
      const data = JSON.parse(new TextDecoder().decode(message.detail.data));
      if (topic === "contexts") {
        const parsed = ContextSchema.safeParse(data);
        if (!parsed.success) return;
        const body = parsed.data;
        //textならそのまま
        if (body.type === "text") {
          const result = await this.companionAgent.addContext(body.context);
          //画像なら画像として処理
        } else if (body.type === "image") {
          const result = await this.companionAgent.addContext({
            image: `data:image/jpeg;base64,${body.context}`,
            mimeType: "image/jpeg",
          });
        }
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
        const parsed = MessageSchema.safeParse(value);
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
        if (body.type === "text") {
          await this.companionAgent.addContext(body.context);
          return c.json({ message: "Added context successfully" }, 201);
        } else if (body.type === "image") {
          await this.companionAgent.addContext({
            image: `data:image/jpeg;base64,${body.context}`,
            mimeType: "image/jpeg",
          });
          return c.json({ message: "Added context successfully" }, 201);
        }
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
