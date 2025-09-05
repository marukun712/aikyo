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

export interface ICompanionServer {
  companionAgent: CompanionAgent;
  companion: CompanionCard;
  libp2p: Awaited<ReturnType<typeof initLibp2p>>;
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
  port: number;
  companionList = new Map<string, Metadata>();

  private static readonly GOSSIPSUB_INIT_DELAY = 500; // GossipSubの初期化遅延
  private static readonly PEER_CONNECT_DELAY = 100; // ピア接続時の遅延

  constructor(companionAgent: CompanionAgent, port: number) {
    this.companionAgent = companionAgent;
    this.companion = companionAgent.companion;
    this.port = port;
  }

  private async initLibp2p() {
    this.libp2p = await initLibp2p();

    //ピア(Companion)を発見したら接続
    this.libp2p.addEventListener("peer:discovery", (evt) => {
      this.libp2p.dial(evt.detail.multiaddrs);
    });

    //各topicのサブスクライブ
    this.libp2p.services.pubsub.subscribe("messages");
    this.libp2p.services.pubsub.subscribe("actions");
    this.libp2p.services.pubsub.subscribe("contexts");
    this.libp2p.services.pubsub.subscribe("metadata"); // Metadataを受信するためのトピック

    //イベントハンドラの設定
    this.libp2p.services.pubsub.addEventListener("message", (evt) =>
      this.handlePubSubMessage(evt)
    );

    // ピアの接続イベントを処理（Metadataをブロードキャスト）
    // TODO: 関数を分けた方が可読性が上がりそう
    this.libp2p.addEventListener(
      "peer:connect",
      async (evt) => await this.handlePeerConnect(evt)
    );

    // ピアの切断イベントを処理
    // TODO: 関数を分けた方が可読性が上がりそう
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

  private async handlePubSubMessage(message: any) {
    // 話題を取得
    const topic = message.detail.topic;
    const fromPeerId = message.detail.from.toString();

    console.log(`Received message on topic ${topic} from ${fromPeerId}`);

    const data = JSON.parse(new TextDecoder().decode(message.detail.data));
    console.log(data);
    try {
      switch (topic) {
        case "contexts": {
          // Contextをパースして、CompanionAgentに追加
          const parsed = ContextSchema.safeParse(data);

          // パースに失敗したら無視
          if (!parsed.success) return;

          // Contextに追加
          const body = parsed.data;
          await this.companionAgent.addContext(body.context);
          break;
        }
        case "metadata": {
          const parsed = MetadataSchema.safeParse(data);
          if (!parsed.success) return;

          // 自分のメッセージは無視
          if (fromPeerId === this.libp2p.peerId.toString()) return;

          // 既に登録済みの場合は無視
          if (this.companionList.has(fromPeerId)) return;

          // CompanionListに追加
          this.companionList.set(fromPeerId, parsed.data);
          console.log(`Added peer ${fromPeerId} with metadata:`, parsed.data);
          break;
        }
        case "messages": {
          const parsed = MessageSchema.safeParse(data);
          console.log("=> Message Received:", parsed);

          if (!parsed.success) return;

          // 自分のメッセージは無視
          if (parsed.data.from === this.companion.metadata.id) return;

          // 対象外のメッセージは無視
          if (parsed.data.to !== this.companion.metadata.id) return;

          // CompanionAgentにメッセージを生成させる
          await this.companionAgent.generateMessage(parsed.data);
          break;
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  //サーバーを起動
  async start() {
    await this.initLibp2p();

    console.log(`Character server started with http://localhost:${this.port}`);
  }
}
