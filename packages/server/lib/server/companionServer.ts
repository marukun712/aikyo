import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import type { IdentifyResult, Message, PeerId } from "@libp2p/interface";
import { mdns } from "@libp2p/mdns";
import { tcp } from "@libp2p/tcp";
import type { Libp2p, Libp2pOptions } from "libp2p";
import { createLibp2p } from "libp2p";
import { LoroDoc } from "loro-crdt";
import type {
  Message as AikyoMessage,
  CompanionCard,
  QueryResult,
} from "../../schema/index.js";
import type { CompanionAgent } from "../agents/index.js";
import { TurnTakingManager } from "../conversation/index.js";
import { logger } from "../logger.js";
import {
  handleMetadataProtocol,
  METADATA_PROTOCOL,
} from "./handlers/metadata.js";
import { onPeerConnect, onPeerDisconnect } from "./handlers/peer.js";
import { handlePubSubMessage } from "./handlers/pubsub.js";
import { handleCRDTSync, setupCRDTSync } from "./handlers/sync.js";

export type Services = {
  pubsub: ReturnType<ReturnType<typeof gossipsub>>;
  identify: ReturnType<ReturnType<typeof identify>>;
};

export interface ICompanionServer {
  start(): Promise<void>;
}

export class CompanionServer implements ICompanionServer {
  private doc: LoroDoc;
  private history: AikyoMessage[];
  private companion: CompanionCard;
  private pendingQueries = new Map<
    string,
    {
      resolve: (value: QueryResult) => void;
      reject: (reason: string) => void;
    }
  >();
  private libp2p!: Libp2p<Services>;
  private companionAgent: CompanionAgent;
  private libp2pConfig?: Libp2pOptions<Services>;

  constructor(
    companionAgent: CompanionAgent,
    history: AikyoMessage[],
    config?: { timeoutDuration: number },
    libp2pConfig?: Libp2pOptions<Services>,
  ) {
    this.doc = new LoroDoc();
    this.companionAgent = companionAgent;
    this.history = history;
    this.companion = companionAgent.companion;

    new TurnTakingManager(
      this.doc,
      this.companionAgent,
      config ? config.timeoutDuration : 5000,
    );

    this.libp2pConfig = libp2pConfig;
  }

  private async setupLibp2p() {
    const defaultConfig: Libp2pOptions<Services> = {
      addresses: { listen: ["/ip4/0.0.0.0/tcp/0"] },
      transports: [tcp()],
      peerDiscovery: [mdns()],
      connectionEncrypters: [noise()],
      streamMuxers: [yamux()],
      services: {
        pubsub: gossipsub({
          allowPublishToZeroTopicPeers: true,
          emitSelf: true,
        }),
        identify: identify(),
      },
    };

    if (!defaultConfig.services)
      throw new Error("Error: Gossipsubの設定が構成されていません！");

    const mergedConfig: Libp2pOptions<Services> = {
      ...defaultConfig,
      ...this.libp2pConfig,
      addresses: {
        ...defaultConfig.addresses,
        ...this.libp2pConfig?.addresses,
      },
      transports: this.libp2pConfig?.transports ?? defaultConfig.transports,
      peerDiscovery:
        this.libp2pConfig?.peerDiscovery ?? defaultConfig.peerDiscovery,
      connectionEncrypters:
        this.libp2pConfig?.connectionEncrypters ??
        defaultConfig.connectionEncrypters,
      streamMuxers:
        this.libp2pConfig?.streamMuxers ?? defaultConfig.streamMuxers,
      services: {
        ...defaultConfig.services,
        ...this.libp2pConfig?.services,
      },
    };

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
    this.libp2p.services.pubsub.subscribe("crdt-sync");

    this.libp2p.services.pubsub.addEventListener(
      "message",
      (evt: CustomEvent<Message>) => {
        const topic = evt.detail.topic;
        if (topic === "crdt-sync") {
          handleCRDTSync(this.doc, evt);
        } else {
          handlePubSubMessage(
            this.history,
            this.companion.metadata,
            this.doc,
            this.pendingQueries,
            evt,
          );
        }
      },
    );

    await this.libp2p.handle(METADATA_PROTOCOL, (data) =>
      handleMetadataProtocol(
        this.companion.metadata,
        this.doc.getMap("companions"),
        data,
      ),
    );

    this.libp2p.addEventListener(
      "peer:identify",
      async (evt: CustomEvent<IdentifyResult>) =>
        onPeerConnect(this.doc.getMap("companions"), this.libp2p, evt),
    );
    this.libp2p.addEventListener(
      "peer:disconnect",
      async (evt: CustomEvent<PeerId>) =>
        onPeerDisconnect(this.doc.getMap("companions"), evt),
    );

    this.companionAgent.runtimeContext.set("libp2p", this.libp2p);
    this.companionAgent.runtimeContext.set("agent", this.companionAgent);
    this.companionAgent.runtimeContext.set(
      "pendingQueries",
      this.pendingQueries,
    );

    // CRDT同期の設定
    setupCRDTSync(this.doc, (topic, data) =>
      this.libp2p.services.pubsub.publish(topic, data),
    );
  }

  async start() {
    await this.setupLibp2p();
    logger.info(
      {
        name: this.companion.metadata.name,
        id: this.companion.metadata.id,
        peerId: this.libp2p.peerId.toString(),
      },
      "Companion started",
    );
  }
}
