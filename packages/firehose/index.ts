import { MessageSchema, QueryResultSchema } from "@aikyo/server";
import type { Services } from "@aikyo/utils";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import { mdns } from "@libp2p/mdns";
import { tcp } from "@libp2p/tcp";
import { createLibp2p, type Libp2p } from "libp2p";
import type WebSocket from "ws";
import { WebSocketServer } from "ws";
import z from "zod";

const RequestSchema = z.object({
  topic: z.string(),
  body: z.union([QueryResultSchema, MessageSchema]),
});

export class Firehose {
  private libp2p!: Libp2p<Services>;
  private wss!: WebSocketServer;
  private clients: Set<WebSocket>;
  private readonly port: number;

  constructor(port: number) {
    this.port = port;
    this.clients = new Set();
  }

  async start() {
    this.libp2p = await createLibp2p({
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
    });

    this.libp2p.addEventListener("peer:discovery", (evt) => {
      this.libp2p.dial(evt.detail.multiaddrs).catch((err) => {
        console.error("Dial error:", err);
      });
    });

    this.libp2p.services.pubsub.subscribe("messages");
    this.libp2p.services.pubsub.subscribe("actions");
    this.libp2p.services.pubsub.subscribe("queries");
    this.libp2p.services.pubsub.subscribe("query-results");

    this.wss = new WebSocketServer({ port: this.port });

    this.wss.on("connection", (ws) => {
      this.clients.add(ws);
      console.log("WebSocket client connected");

      ws.on("message", (evt) => {
        try {
          const data = JSON.parse(evt.toString());
          const parsed = RequestSchema.safeParse(data);
          if (parsed.success) {
            console.log(parsed.data);
            switch (parsed.data.topic) {
              case "messages":
                this.libp2p.services.pubsub.publish(
                  "messages",
                  new TextEncoder().encode(JSON.stringify(parsed.data.body)),
                );
                break;
              case "query-results":
                this.libp2p.services.pubsub.publish(
                  "query-results",
                  new TextEncoder().encode(JSON.stringify(parsed.data.body)),
                );
                break;
              default:
                console.log("Unknown topic:", parsed.data.topic);
            }
          }
        } catch (e) {
          console.log(e);
        }
      });

      ws.on("close", () => {
        this.clients.delete(ws);
        console.log("WebSocket client disconnected");
      });
    });

    this.libp2p.services.pubsub.addEventListener("message", async (message) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(message.detail.data));
        console.log(data);
        const payload = JSON.stringify(data);
        for (const client of this.clients) {
          if (client.readyState === 1) {
            client.send(payload);
          }
        }
      } catch (e) {
        console.log(e);
      }
    });

    console.log(`aikyo firehose server running on ws://localhost:${this.port}`);
  }
}

const firehose = new Firehose(8080);
try {
  await firehose.start();
} catch (err) {
  console.error("Failed to start firehose:", err);
  process.exit(1);
}
