import type { CompanionCard, Metadata } from "../../schema/index.ts";
import { CompanionAgent } from "../agents/index.ts";
import { initLibp2p } from "./libp2p.ts";
import { onPeerConnect, onPeerDisconnect, publishInitialMetadata } from "./handlers/peer.ts";
import { handlePubSubMessage } from "./handlers/pubsub.ts";

export interface ICompanionServer {
  companionAgent: CompanionAgent;
  companion: CompanionCard;
  libp2p: Awaited<ReturnType<typeof initLibp2p>>;
  companionList: Map<string, Metadata>;
  start(): Promise<void>;
}

export class CompanionServer implements ICompanionServer {
  companionAgent: CompanionAgent;
  companion: CompanionCard;
  libp2p!: Awaited<ReturnType<typeof initLibp2p>>;
  companionList = new Map<string, Metadata>();

  constructor(companionAgent: CompanionAgent) {
    this.companionAgent = companionAgent;
    this.companion = companionAgent.companion;
  }

  private async setupLibp2p() {
    this.libp2p = await initLibp2p();

    this.libp2p.addEventListener("peer:discovery", (evt) => {
      this.libp2p.dial(evt.detail.multiaddrs);
    });

    this.libp2p.services.pubsub.subscribe("messages");
    this.libp2p.services.pubsub.subscribe("actions");
    this.libp2p.services.pubsub.subscribe("contexts");
    this.libp2p.services.pubsub.subscribe("metadata");

    this.libp2p.services.pubsub.addEventListener("message", (evt) =>
      handlePubSubMessage(this, evt),
    );

    this.libp2p.addEventListener("peer:connect", async (evt) => onPeerConnect(this, evt));
    this.libp2p.addEventListener("peer:disconnect", async (evt) => onPeerDisconnect(this, evt));

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
