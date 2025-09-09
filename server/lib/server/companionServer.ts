import type { Services } from "@aikyo/utils";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import type { Message, PeerId } from "@libp2p/interface";
import { mdns } from "@libp2p/mdns";
import { tcp } from "@libp2p/tcp";
import type { Libp2p } from "libp2p";
import { createLibp2p } from "libp2p";
import type {
  Message as AikyoMessage,
  CompanionCard,
  Metadata,
} from "../../schema/index.ts";
import type { CompanionAgent } from "../agents/index.ts";

import { TurnTakingManager } from "../conversation/index.ts";
import {
  onPeerConnect,
  onPeerDisconnect,
  publishInitialMetadata,
} from "./handlers/peer.ts";
import { handlePubSubMessage } from "./handlers/pubsub.ts";

export interface ICompanionServer {
  companionAgent: CompanionAgent;
  turnTakingManager: TurnTakingManager;
  companion: CompanionCard;
  libp2p: Libp2p<Services>;
  companionList: Map<string, Metadata>;
  start(): Promise<void>;
}

export class CompanionServer implements ICompanionServer {
  companionAgent: CompanionAgent;
  turnTakingManager: TurnTakingManager;
  companion: CompanionCard;
  libp2p!: Libp2p<Services>;
  companionList = new Map<string, Metadata>();

  constructor(companionAgent: CompanionAgent) {
    this.companionAgent = companionAgent;
    this.companion = companionAgent.companion;
    this.turnTakingManager = new TurnTakingManager(
      this.companionAgent,
      this.companionList,
    );
  }

  private async setupLibp2p() {
    this.libp2p = await createLibp2p({
      addresses: { listen: ["/ip4/0.0.0.0/tcp/0"] },
      transports: [tcp()],
      peerDiscovery: [mdns()],
      connectionEncrypters: [noise()],
      streamMuxers: [yamux()],
      services: {
        pubsub: gossipsub({
          allowPublishToZeroTopicPeers: true,
        }),
        identify: identify(),
      },
    });

    this.libp2p.addEventListener("peer:discovery", (evt) => {
      this.libp2p.dial(evt.detail.multiaddrs).catch((error) => {
        console.error(`ピアへの接続に失敗しました: ${evt.detail.id}`, error);
      });
    });

    this.libp2p.services.pubsub.subscribe("messages");
    this.libp2p.services.pubsub.subscribe("metadata");
    this.libp2p.services.pubsub.subscribe("states");

    this.libp2p.services.pubsub.addEventListener(
      "message",
      (evt: CustomEvent<Message>) => handlePubSubMessage(this, evt),
    );

    this.libp2p.addEventListener(
      "peer:connect",
      async (evt: CustomEvent<PeerId>) => onPeerConnect(this, evt),
    );
    this.libp2p.addEventListener(
      "peer:disconnect",
      async (evt: CustomEvent<PeerId>) => onPeerDisconnect(this, evt),
    );
    this.companionAgent.runtimeContext.set("libp2p", this.libp2p);
    this.companionAgent.runtimeContext.set("companions", this.companionList);
    await publishInitialMetadata(this);
  }

  async handleMessageReceived(message: AikyoMessage) {
    const state = await this.companionAgent.generateState(message);
    this.libp2p.services.pubsub.publish(
      "states",
      new TextEncoder().encode(JSON.stringify(state)),
    );
    this.turnTakingManager.addPending(message);
  }

  async start() {
    await this.setupLibp2p();
    console.log(
      `Companion started: ${this.companion.metadata.name} ` +
        `(id=${this.companion.metadata.id}, peerId=${this.libp2p.peerId.toString()})`,
    );
  }
}
