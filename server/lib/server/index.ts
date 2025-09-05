import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { createLibp2p, Libp2p } from "libp2p";
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
import { MessageSchema } from "../../schema/index.ts";
import { Services } from "@aikyo/utils";

export interface ICompanionServer {
  companionAgent: CompanionAgent;
  companion: CompanionCard;
  libp2p: Libp2p<Services>;
  app: Hono;
  port: number;
  companionList: Map<string, Metadata>;

  start(): Promise<void>;
}

export class CompanionServer implements ICompanionServer {
  companionAgent: CompanionAgent;
  companion: CompanionCard;
  libp2p: Libp2p<Services>;
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
    const libp2p = await createLibp2p({
      addresses: { listen: ["/ip4/0.0.0.0/tcp/0"] },
      transports: [tcp()],
      peerDiscovery: [mdns()], //mdnsでピア探索(ローカル限定)
      connectionEncrypters: [noise()],
      streamMuxers: [yamux()],
      services: {
        pubsub: gossipsub({ allowPublishToZeroTopicPeers: true }),
        identify: identify({
          agentVersion: JSON.stringify(this.companion.metadata, null, 2),
        }),
      },
    });

    //peer発見時に自動dial
    libp2p.addEventListener("peer:discovery", (evt) => {
      this.libp2p.dial(evt.detail.multiaddrs);
    });

    //messagesトピックをサブスクライブ
    libp2p.services.pubsub.subscribe("messages");

    //message受信時
    libp2p.services.pubsub.addEventListener("message", async (evt) => {
      const topic = evt.detail.topic;
      try {
        const data = JSON.parse(new TextDecoder().decode(evt.detail.data));
        if (topic === "messages") {
          const parsed = MessageSchema.safeParse(data);
          console.log("message received.");
          console.log(parsed);
          if (!parsed.success) return;
          const body = parsed.data;
          await this.companionAgent.input(body);
        }
      } catch (err) {
        console.error("Error processing pubsub message:", err);
      }
    });

    //peer接続時
    libp2p.addEventListener("peer:identify", async (evt) => {
      try {
        const { agentVersion, peerId } = evt.detail;
        if (!agentVersion) return;
        const parsed = MetadataSchema.safeParse(JSON.parse(agentVersion));
        if (this.companionList.has(peerId.toString()) || !parsed.success)
          return;
        this.companionList.set(peerId.toString(), parsed.data);
        console.log(
          `Identified peer ${peerId.toString()} with metadata:`,
          agentVersion,
        );
      } catch (e) { }
    });

    //peer切断時
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
      } catch (e) { }
    });

    //toolからlibp2pインスタンスを参照するためのRuntimeContext
    this.companionAgent.runtimeContext.set("libp2p", libp2p);
    this.companionAgent.runtimeContext.set("companions", this.companionList);

    this.libp2p = libp2p;
  }

  //サーバーを起動
  async start() {
    await this.initLibp2p();

    serve({ fetch: this.app.fetch, port: this.port });
    console.log(`Character server running on http://localhost:${this.port}`);
  }
}
