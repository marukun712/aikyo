import { createHash } from "node:crypto";
import type { gossipsub } from "@chainsafe/libp2p-gossipsub";
import type { identify } from "@libp2p/identify";
import type { IdentifyResult, Message, PeerId } from "@libp2p/interface";
import type { Libp2p, Libp2pOptions } from "libp2p";
import { createLibp2p } from "libp2p";
import type {
  Message as AikyoMessage,
  CompanionCard,
  Metadata,
  QueryResult,
} from "../../schema/index.js";
import type { CompanionAgent } from "../agents/index.js";
import { logger } from "../logger.js";
import {
  handleMetadataProtocol,
  METADATA_PROTOCOL,
} from "./handlers/metadata.js";
import { onPeerConnect, onPeerDisconnect } from "./handlers/peer.js";
import { handlePubSubMessage } from "./handlers/pubsub.js";
import { mergeConfig } from "./libp2p/mergeConfig.js";

export type Services = {
  pubsub: ReturnType<ReturnType<typeof gossipsub>>;
  identify: ReturnType<ReturnType<typeof identify>>;
};

export interface ICompanionServer {
  agent: CompanionAgent;
  card: CompanionCard;
  companionList: Map<string, Metadata>;
  pendingQueries: Map<
    string,
    {
      resolve: (value: QueryResult) => void;
      reject: (reason: string) => void;
    }
  >;
  history: AikyoMessage[];
  libp2p: Libp2p<Services>;

  start(): Promise<void>;
}

export class CompanionServer implements ICompanionServer {
  agent: CompanionAgent;
  card: CompanionCard;
  companionList = new Map<string, Metadata>();
  pendingQueries = new Map<
    string,
    {
      resolve: (value: QueryResult) => void;
      reject: (reason: string) => void;
    }
  >();
  history: AikyoMessage[];
  libp2p!: Libp2p<Services>;

  private libp2pConfig?: Libp2pOptions<Services>;

  constructor(
    companionAgent: CompanionAgent,
    history: AikyoMessage[],
    libp2pConfig?: Libp2pOptions<Services>,
  ) {
    this.agent = companionAgent;
    this.card = companionAgent.card;
    this.companionList.set(this.card.metadata.id, this.card.metadata);
    this.history = history;

    this.libp2pConfig = libp2pConfig;
  }

  private async setupLibp2p() {
    const mergedConfig = mergeConfig(this.libp2pConfig);
    this.libp2p = await createLibp2p(mergedConfig);

    this.libp2p.addEventListener("peer:discovery", (evt) => {
      this.libp2p.dial(evt.detail.multiaddrs).catch((error) => {
        logger.error(
          { error, peerId: evt.detail.id.toString() },
          "Failed to connect to peer",
        );
      });
    });

    this.libp2p.services.pubsub.subscribe("messages");
    this.libp2p.services.pubsub.subscribe("states");
    this.libp2p.services.pubsub.subscribe("queries");

    this.libp2p.services.pubsub.addEventListener(
      "message",
      (evt: CustomEvent<Message>) => handlePubSubMessage(this, evt),
    );

    await this.libp2p.handle(METADATA_PROTOCOL, (data) =>
      handleMetadataProtocol(this, data),
    );

    this.libp2p.addEventListener(
      "peer:identify",
      async (evt: CustomEvent<IdentifyResult>) => onPeerConnect(this, evt),
    );
    this.libp2p.addEventListener(
      "peer:disconnect",
      async (evt: CustomEvent<PeerId>) => onPeerDisconnect(this, evt),
    );

    this.agent.runtimeContext.set("libp2p", this.libp2p);
    this.agent.runtimeContext.set("companions", this.companionList);
    this.agent.runtimeContext.set("pendingQueries", this.pendingQueries);
    this.agent.runtimeContext.set("agent", this.agent);
  }

  private selectLeader(message: AikyoMessage) {
    const active = Array.from(this.companionList.values()).map(
      (metadata) => metadata.id,
    );
    // 存在しないコンパニオンのStateを除外
    const valid = message.params.to.filter((to) => active.includes(to));
    const hash = createHash("md5")
      .update(JSON.stringify(message))
      .digest("hex");
    const hashNum = BigInt(`0x${hash}`);
    const index = Number(hashNum % BigInt(valid.length));
    return valid[index];
  }

  async onMessage(message: AikyoMessage) {
    if (this.agent.generating) return;
    const leader = this.selectLeader(message);
    if (leader === this.card.metadata.id) {
      this.agent.generating = true;
      try {
        const states = await this.agent.getStates(message);
        logger.info({ states }, "states");
        const payload = new TextEncoder().encode(JSON.stringify(states));
        this.libp2p.services.pubsub.publish("states", payload);
      } finally {
        this.agent.generating = false;
      }
    }
  }

  async start() {
    await this.setupLibp2p();
    logger.info(
      {
        name: this.card.metadata.name,
        id: this.card.metadata.id,
        peerId: this.libp2p.peerId.toString(),
      },
      "Companion started",
    );
  }
}
