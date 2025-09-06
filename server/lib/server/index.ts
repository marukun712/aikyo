import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { createLibp2p, type Libp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import { identify } from "@libp2p/identify";
import { mdns } from "@libp2p/mdns";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import {
  MetadataSchema,
  MessageSchema,
  StateSchema,
  type State,
  type CompanionCard,
  type Message,
  type Metadata,
} from "../../schema/index.ts";
import { CompanionAgent } from "../agents/index.ts";
import { type Services } from "@aikyo/utils";

export interface ICompanionServer {
  companionAgent: CompanionAgent;
  companion: CompanionCard;
  libp2p: Libp2p<Services>;
  app: Hono;
  port: number;
  companionList: Map<string, Metadata>;
  pendingMessage: Map<string, State[]>;
  originalMessages: Map<string, Message>;

  start(): Promise<void>;
}

export class CompanionServer implements ICompanionServer {
  companionAgent: CompanionAgent;
  companion: CompanionCard;
  libp2p: Libp2p<Services>;
  app: Hono;
  port: number;
  companionList = new Map<string, Metadata>();
  pendingMessage = new Map<string, State[]>();
  originalMessages = new Map<string, Message>();

  constructor(companionAgent: CompanionAgent, port: number) {
    this.companionAgent = companionAgent;
    this.companion = companionAgent.companion;
    this.companionList.set(this.companion.metadata.id, this.companion.metadata);
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
        pubsub: gossipsub({
          allowPublishToZeroTopicPeers: true,
          emitSelf: true
        }),
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
    libp2p.services.pubsub.subscribe("states");

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
          await this.handleMessageReceived(body);
        } else if (topic === "states") {
          const parsed = StateSchema.safeParse(data);
          console.log("state received.");
          console.log(parsed);
          if (!parsed.success) return;
          const state = parsed.data;
          await this.handleStateReceived(state);
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

  private async handleMessageReceived(message: Message) {
    const state = await this.companionAgent.generateState(message);
    this.libp2p.services.pubsub.publish(
      "states",
      new TextEncoder().encode(JSON.stringify(state)),
    );
    console.log("State published:", state);
    this.originalMessages.set(message.id, message);
  }

  private async handleStateReceived(state: State) {
    const messageId = state.messageId;
    if (!this.pendingMessage.has(messageId)) {
      this.pendingMessage.set(messageId, []);
    }
    const states = this.pendingMessage.get(messageId);
    if (!states) return;
    states.push(state);
    console.log(states);
    console.log(
      `State received for message ${messageId}. Total states: ${states.length}`,
    );
    const expectedStates = this.companionList.size;
    if (states.length === expectedStates) {
      console.log(
        `All states collected for message ${messageId}. Deciding next speaker.`,
      );
      await this.decideNextSpeaker(messageId, states);
    }
  }

  private async decideNextSpeaker(messageId: string, states: State[]) {
    const selectedAgents = states.filter((state) => state.selected);
    if (selectedAgents.length > 0) {
      const speaker = selectedAgents.reduce((prev, current) =>
        prev.importance > current.importance ? prev : current,
      );
      await this.executeSpeaker(messageId, speaker);
      return;
    }
    const speakAgents = states.filter((state) => state.state === "speak");
    if (speakAgents.length > 0) {
      const speaker = speakAgents.reduce((prev, current) =>
        prev.importance > current.importance ? prev : current,
      );
      await this.executeSpeaker(messageId, speaker);
      return;
    }
    this.originalMessages.delete(messageId);
    this.pendingMessage.delete(messageId);
    console.log(`No speaker found for message ${messageId}. Cleaning up.`);
  }

  private async executeSpeaker(messageId: string, speaker: State) {
    console.log(
      `Speaker selected: ${speaker.id} (importance: ${speaker.importance})`,
    );
    if (speaker.id === this.companion.metadata.id) {
      try {
        console.log("I was selected to speak. Executing input logic...");
        const originalMessage = this.originalMessages.get(messageId);
        if (originalMessage) {
          await new Promise<void>((resolve) => {
            setTimeout(() => {
              resolve()
            }, 5000);
          })

          await this.companionAgent.input(originalMessage);
        } else {
          console.warn(
            `Original message not found for messageId: ${messageId}`,
          );
        }
      } catch (error) {
        console.error("Failed to execute speaker logic:", error);
      }
    }

    this.originalMessages.delete(messageId);
    this.pendingMessage.delete(messageId);
  }

  //サーバーを起動
  async start() {
    await this.initLibp2p();

    serve({ fetch: this.app.fetch, port: this.port });
    console.log(`Character server running on http://localhost:${this.port}`);
  }
}
