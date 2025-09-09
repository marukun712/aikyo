import type { CompanionCard, Metadata } from "../../schema/index.ts";
import type { CompanionAgent } from "../agents/index.ts";
import {
  onPeerConnect,
  onPeerDisconnect,
  publishInitialMetadata,
} from "./handlers/peer.ts";
import { handlePubSubMessage } from "./handlers/pubsub.ts";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import { mdns } from "@libp2p/mdns";
import { tcp } from "@libp2p/tcp";
import { createLibp2p, type Libp2p } from "libp2p";
import type { Services } from "@aikyo/utils";
import type { Message, PeerId } from "@libp2p/interface";

export interface ICompanionServer {
  companionAgent: CompanionAgent;
  companion: CompanionCard;
  libp2p: Libp2p<Services>;
  companionList: Map<string, Metadata>;
  start(): Promise<void>;
}

export class CompanionServer implements ICompanionServer {
  companionAgent: CompanionAgent;
  companion: CompanionCard;
  libp2p!: Libp2p<Services>;
  companionList = new Map<string, Metadata>();

  constructor(companionAgent: CompanionAgent) {
    this.companionAgent = companionAgent;
    this.companion = companionAgent.companion;
  }

  private async setupLibp2p() {
    const libp2p = await createLibp2p({
      addresses: { listen: ["/ip4/0.0.0.0/tcp/0"] },
      transports: [tcp()],
      peerDiscovery: [mdns()],
      connectionEncrypters: [noise()],
      streamMuxers: [yamux()],
      services: {
        pubsub: gossipsub({ allowPublishToZeroTopicPeers: true }),
        identify: identify(),
      },
    });

    libp2p.addEventListener("peer:discovery", (evt) => {
      this.libp2p.dial(evt.detail.multiaddrs).catch((error) => {
        console.error(`ピアへの接続に失敗しました: ${evt.detail.id}`, error);
      });
    });

    libp2p.services.pubsub.subscribe("messages");
    libp2p.services.pubsub.subscribe("metadata");
    libp2p.services.pubsub.subscribe("states");

    libp2p.services.pubsub.addEventListener(
      "message",
      (evt: CustomEvent<Message>) => handlePubSubMessage(this, evt),
    );

    libp2p.addEventListener("peer:connect", async (evt: CustomEvent<PeerId>) =>
      onPeerConnect(this, evt),
    );
    libp2p.addEventListener(
      "peer:disconnect",
      async (evt: CustomEvent<PeerId>) => onPeerDisconnect(this, evt),
    );

    this.libp2p = libp2p;
    this.companionAgent.runtimeContext.set("libp2p", this.libp2p);
    this.companionAgent.runtimeContext.set("companions", this.companionList);

    await publishInitialMetadata(this);
  }

  async start() {
    await this.setupLibp2p();
    console.log(
      `Character started: ${this.companion.metadata.name} ` +
        `(id=${this.companion.metadata.id}, peerId=${this.libp2p.peerId.toString()})`,
    );
  }
}
