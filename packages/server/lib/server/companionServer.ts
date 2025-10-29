import type { gossipsub } from "@chainsafe/libp2p-gossipsub";
import type { identify } from "@libp2p/identify";
import type { IdentifyResult, Message, PeerId } from "@libp2p/interface";
import type { Libp2p, Libp2pOptions } from "libp2p";
import { createLibp2p } from "libp2p";
import { LoroDoc, type LoroMap } from "loro-crdt";
import {
  type Message as AikyoMessage,
  type CompanionCard,
  MessageSchema,
  type Metadata,
  type QueryResult,
  type State,
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
import { setupCRDTSync } from "./handlers/sync.js";
import { mergeConfig } from "./libp2p/mergeConfig.js";

export type Services = {
  pubsub: ReturnType<ReturnType<typeof gossipsub>>;
  identify: ReturnType<ReturnType<typeof identify>>;
};

export interface ICompanionServer {
  doc: LoroDoc;

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
  states: LoroMap;

  history: AikyoMessage[];
  turnTakingManager: TurnTakingManager;

  libp2p: Libp2p<Services>;
  libp2pConfig?: Libp2pOptions<Services>;

  start(): Promise<void>;
}

export class CompanionServer implements ICompanionServer {
  doc: LoroDoc;

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
  states: LoroMap;
  message: LoroMap;

  history: AikyoMessage[];
  turnTakingManager: TurnTakingManager;

  libp2p!: Libp2p<Services>;
  libp2pConfig?: Libp2pOptions<Services>;

  constructor(
    companionAgent: CompanionAgent,
    history: AikyoMessage[],
    config?: { timeoutDuration: number },
    libp2pConfig?: Libp2pOptions<Services>,
  ) {
    this.doc = new LoroDoc();
    this.agent = companionAgent;
    this.card = companionAgent.companion;

    this.companionList.set(this.card.metadata.id, this.card.metadata);
    this.states = this.doc.getMap("states");
    this.message = this.doc.getMap("message");

    this.history = history;
    this.turnTakingManager = new TurnTakingManager(
      this.doc,
      config?.timeoutDuration,
    );

    this.libp2pConfig = libp2pConfig;

    this.turnTakingManager.on(
      "selected",
      (speaker: State, messageId: string) => {
        if (speaker.params.closing === "terminal")
          return logger.info(
            { speaker, messageId },
            "The conversation is over.",
          );

        logger.info({ speaker, messageId }, "Speaker selected");

        const currentMessage = this.message.get("current");
        const parsed = MessageSchema.safeParse(currentMessage);

        if (parsed.success && parsed.data.params.id !== messageId) {
          logger.info(
            {
              currentMessageId: parsed.data.params.id,
              selectedMessageId: messageId,
            },
            "Message ID mismatch, skipping generate",
          );
          return;
        }

        if (speaker.params.from === this.card.metadata.id) {
          logger.info({ messageId }, "input");
          this.agent.generate();
        }
      },
    );
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
    this.libp2p.services.pubsub.subscribe("crdt-sync");

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

    setupCRDTSync(this.doc, (topic, data) =>
      this.libp2p.services.pubsub.publish(topic, data),
    );

    this.agent.runtimeContext.set("libp2p", this.libp2p);
    this.agent.runtimeContext.set("companions", this.companionList);
    this.agent.runtimeContext.set("pendingQueries", this.pendingQueries);
    this.agent.runtimeContext.set("agent", this.agent);
  }

  async handleMessageReceived(message: AikyoMessage) {
    await this.turnTakingManager.set(message);
    const state = await this.agent.getState();
    this.states.set(this.card.metadata.id, state);
    this.doc.commit();
    const payload = new TextEncoder().encode(JSON.stringify(state));
    //互換性のためlibp2pにもpublish
    this.libp2p.services.pubsub.publish("states", payload);
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
