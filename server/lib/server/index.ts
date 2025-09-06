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
  companionList: Map<string, Metadata>;
  pendingMessage: Map<string, State[]>;
  originalMessages: Map<string, Message>;

  start(): Promise<void>;
}

export class CompanionServer implements ICompanionServer {
  companionAgent: CompanionAgent;
  companion: CompanionCard;
  libp2p: Libp2p<Services>;
  companionList = new Map<string, Metadata>();
  pendingMessage = new Map<string, State[]>();
  originalMessages = new Map<string, Message>();

  private static readonly GOSSIPSUB_INIT_DELAY = 500; // GossipSubの初期化遅延
  private static readonly PEER_CONNECT_DELAY = 100; // ピア接続時の遅延

  constructor(companionAgent: CompanionAgent) {
    this.companionAgent = companionAgent;
    this.companion = companionAgent.companion;
    this.companionList.set(this.companion.metadata.id, this.companion.metadata);
  }

  private async initLibp2p() {
    this.libp2p = await createLibp2p({
      addresses: { listen: ["/ip4/0.0.0.0/tcp/0"] },
      transports: [tcp()],
      peerDiscovery: [mdns()], //mdnsでピア探索(ローカル限定)
      connectionEncrypters: [noise()],
      streamMuxers: [yamux()],
      services: {
        pubsub: gossipsub({
          allowPublishToZeroTopicPeers: true,
          emitSelf: true,
        }),
        identify: identify(),
      },
    });

    //ピア(Companion)を発見したら接続
    this.libp2p.addEventListener("peer:discovery", (evt) => {
      this.libp2p.dial(evt.detail.multiaddrs);
    });

    // 各topicのサブスクライブ
    this.libp2p.services.pubsub.subscribe("messages");
    this.libp2p.services.pubsub.subscribe("actions");
    this.libp2p.services.pubsub.subscribe("states");

    //message受信時
    this.libp2p.services.pubsub.addEventListener("message", async (evt) => {
      const topic = evt.detail.topic;
      try {
        const data = JSON.parse(new TextDecoder().decode(evt.detail.data));
        switch (topic) {
          case "messages": {
            const parsed = MessageSchema.safeParse(data);
            console.log("message received.");
            console.log(parsed);
            if (!parsed.success) return;
            const body = parsed.data;
            await this.handleMessageReceived(body);
            break;
          }

          case "states": {
            const parsed = StateSchema.safeParse(data);
            console.log("state received.");
            console.log(parsed);
            if (!parsed.success) return;
            const state = parsed.data;
            await this.handleStateReceived(state);
          }

          case "metadata": {
            console.dir(data);
            const parsed = MetadataSchema.safeParse(data);
            console.log("metadata received.");
            console.log(parsed);
            if (!parsed.success) return;

            // 自分のメッセージは無視
            // if (fromPeerId === this.libp2p.peerId.toString()) return;

            // 既に登録済みの場合は無視
            // if (this.companionList.has(fromPeerId)) return;

            const metadata = parsed.data;

            await this.handleMetadataReceived(metadata, fromPeerId);
          }
        }
      } catch (err) {
        console.error("Error processing pubsub message:", err);
      }
    });

    // ピアの接続イベントを処理（Metadataをブロードキャスト）
    this.libp2p.addEventListener(
      "peer:connect",
      async (evt) => await this.handlePeerConnect(evt)
    );

    // ピアの切断イベントを処理
    this.libp2p.addEventListener(
      "peer:disconnect",
      async (evt) => await this.handlePeerDisconnect(evt)
    );

    //tool呼び出しのためRuntimeContextにSet
    this.companionAgent.runtimeContext.set("libp2p", this.libp2p);
    this.companionAgent.runtimeContext.set("companions", this.companionList);

    // 初期化後、少し待ってから自分のメタデータをpublish
    // これにより既に接続済みのピア間でもメタデータ交換が可能になる
    setTimeout(async () => {
      try {
        const metadataMsg = JSON.stringify(this.companion.metadata);
        await this.libp2p.services.pubsub.publish(
          "metadata",
          new TextEncoder().encode(metadataMsg)
        );
        console.log("Initial metadata published");
      } catch (e) {
        console.error("Error publishing initial metadata:", e);
      }
    }, CompanionServer.GOSSIPSUB_INIT_DELAY);
  }

  private async handlePeerConnect(evt: any) {
    try {
      console.log(`Peer connected: ${evt.detail.toString()}`);
      // GossipSubの準備ができるまで少し待機
      await new Promise((resolve) =>
        setTimeout(resolve, CompanionServer.PEER_CONNECT_DELAY)
      );

      // 新しいピアが接続した時、既存のピアも自分のMetadataを再送信する
      // これにより、新しいピアは既存のピアのメタデータを受信できる
      const metadataMsg = JSON.stringify(this.companion.metadata);
      await this.libp2p.services.pubsub.publish(
        "metadata",
        new TextEncoder().encode(metadataMsg)
      );
    } catch (e) {
      console.error("Error during peer connection:", e);
    }
  }

  private async handlePeerDisconnect(evt: any) {
    try {
      const peerIdStr = evt.detail.toString();
      const metadata = this.companionList.get(peerIdStr);
      if (!this.companionList.has(peerIdStr)) return;
      console.log(`Peer disconnected: ${peerIdStr}, metadata was:`, metadata);
      this.companionList.delete(peerIdStr);
    } catch (e) {
      console.error(e);
    }
  }

  private async handleMessageReceived(message: Message) {
    const state = await this.companionAgent.generateState(message);
    this.libp2p.services.pubsub.publish(
      "states",
      new TextEncoder().encode(JSON.stringify(state))
    );
    this.originalMessages.set(message.id, message);
  }

  private async handleStateReceived(state: State) {
    const messageId = state.messageId;
    if (!this.pendingMessage.has(messageId)) {
      this.pendingMessage.set(messageId, []);
    }
    const states = this.pendingMessage.get(messageId);
    if (!states) return;
    console.log(states);
    states.push(state);
    console.log(
      `State received for message ${messageId}. Total states: ${states.length}`
    );
    const expectedStates = this.companionList.size;
    if (states.length === expectedStates) {
      console.log(
        `All states collected for message ${messageId}. Deciding next speaker.`
      );
      await this.decideNextSpeaker(messageId, states);
    }
  }

  private async decideNextSpeaker(messageId: string, states: State[]) {
    const selectedAgents = states.filter((state) => state.selected);
    if (selectedAgents.length > 0) {
      const speaker = selectedAgents.reduce((prev, current) =>
        prev.importance > current.importance ? prev : current
      );
      await this.executeSpeaker(messageId, speaker);
      return;
    }
    const speakAgents = states.filter((state) => state.state === "speak");
    if (speakAgents.length > 0) {
      const speaker = speakAgents.reduce((prev, current) =>
        prev.importance > current.importance ? prev : current
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
      `Speaker selected: ${speaker.id} (importance: ${speaker.importance})`
    );
    if (speaker.id === this.companion.metadata.id) {
      try {
        console.log("I was selected to speak. Executing input logic...");
        const originalMessage = this.originalMessages.get(messageId);
        if (originalMessage) {
          await new Promise<void>((resolve) => {
            setTimeout(() => {
              resolve();
            }, 5000);
          });

          await this.companionAgent.input(originalMessage);
        } else {
          console.warn(
            `Original message not found for messageId: ${messageId}`
          );
        }
      } catch (error) {
        console.error("Failed to execute speaker logic:", error);
      }
    }

    this.originalMessages.delete(messageId);
    this.pendingMessage.delete(messageId);
  }

  private async handleMetadataReceived(metadata: Metadata, fromPeerId: string) {
    // 自分のメッセージは無視
    if (fromPeerId === this.libp2p.peerId.toString()) return;

    // 既に登録済みの場合は無視
    if (this.companionList.has(fromPeerId)) return;

    // CompanionListに追加
    this.companionList.set(fromPeerId, metadata);
    console.log(`Added peer ${fromPeerId} with metadata:`, metadata);
  }

  //サーバーを起動
  async start() {
    await this.initLibp2p();
    console.log("Companion Server is running");
  }
}
