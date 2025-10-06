import type { Action, Message, Query, QueryResult, State } from "@aikyo/server";
import { MessageSchema, QueryResultSchema, type Services } from "@aikyo/server";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import { mdns } from "@libp2p/mdns";
import { tcp } from "@libp2p/tcp";
import { createLibp2p, type Libp2p, type Libp2pOptions } from "libp2p";
import type WebSocket from "ws";
import { WebSocketServer } from "ws";
import z from "zod";
import { logger } from "./lib/logger.js";

const RequestSchema = z.union([QueryResultSchema, MessageSchema]);

type TopicPayloads = {
  messages: Message;
  queries: Query | QueryResult;
  actions: Action;
  states: State;
};

export class Firehose {
  private libp2p!: Libp2p<Services>;
  private wss!: WebSocketServer;
  private clients: Set<WebSocket>;
  private readonly port: number;
  private topicHandlers: {
    [K in keyof TopicPayloads]: ((data: TopicPayloads[K]) => void)[];
  } = {
    messages: [],
    queries: [],
    actions: [],
    states: [],
  };
  private libp2pConfig?: Libp2pOptions<Services>;

  constructor(port: number, libp2pConfig?: Libp2pOptions<Services>) {
    this.port = port;
    this.clients = new Set();
    this.libp2pConfig = libp2pConfig;
  }

  async start() {
    this.libp2p = await createLibp2p(
      this.libp2pConfig || {
        addresses: {
          listen: ["/ip4/0.0.0.0/tcp/0"],
        },
        transports: [tcp()],
        peerDiscovery: [mdns()],
        connectionEncrypters: [noise()],
        streamMuxers: [yamux()],
        services: {
          pubsub: gossipsub({ allowPublishToZeroTopicPeers: true }),
          identify: identify(),
        },
      },
    );

    this.libp2p.addEventListener("peer:discovery", (evt) => {
      this.libp2p.dial(evt.detail.multiaddrs).catch((err) => {
        logger.error({ err }, "Dial error");
      });
    });

    this.wss = new WebSocketServer({ port: this.port });

    this.wss.on("connection", (ws) => {
      this.clients.add(ws);

      ws.on("message", (evt) => {
        try {
          const data = JSON.parse(evt.toString());
          const parsed = RequestSchema.safeParse(data);
          if (!parsed.success) {
            ws.send(JSON.stringify({ error: parsed.error }));
            return;
          }
          const topic: keyof TopicPayloads =
            "method" in parsed.data ? "messages" : "queries";
          this.libp2p.services.pubsub.publish(
            topic,
            new TextEncoder().encode(JSON.stringify(parsed.data)),
          );
        } catch (e) {
          logger.error({ err: e }, "Error handling WebSocket message");
        }
      });

      ws.on("close", () => {
        this.clients.delete(ws);
      });
    });

    this.libp2p.services.pubsub.addEventListener("message", async (message) => {
      try {
        const topic = message.detail.topic as keyof TopicPayloads;
        if (!(topic in this.topicHandlers)) return;
        const data = JSON.parse(new TextDecoder().decode(message.detail.data));
        logger.info(data);
        const handlers = this.topicHandlers[topic];
        for (const handler of handlers) {
          handler(data);
        }
      } catch (e) {
        logger.error({ err: e }, "Error handling pubsub message");
      }
    });

    logger.info(`aikyo firehose server running on ws://localhost:${this.port}`);
  }

  async subscribe<K extends keyof TopicPayloads>(
    topic: K,
    handler?: (data: TopicPayloads[K]) => void,
  ) {
    await this.libp2p.services.pubsub.subscribe(topic);
    if (handler) {
      this.addHandler(topic, handler);
    }
  }

  addHandler<K extends keyof TopicPayloads>(
    topic: K,
    handler: (data: TopicPayloads[K]) => void,
  ) {
    this.topicHandlers[topic].push(handler);
  }

  broadcastToClients(data: unknown) {
    const payload = JSON.stringify(data);
    for (const client of this.clients) {
      if (client.readyState === 1) {
        client.send(payload);
      }
    }
  }
}
