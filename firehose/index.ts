import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { createLibp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import { identify } from "@libp2p/identify";
import { mdns } from "@libp2p/mdns";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { MessageSchema } from "../server/schema/index.ts";
import { z } from "zod";
import WebSocket, { WebSocketServer } from "ws";

export const WSSMessageSchema = z.object({
  topic: z.enum(["messages", "actions", "contexts"]),
  data: MessageSchema,
});

export const libp2p = await createLibp2p({
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

libp2p.addEventListener("peer:discovery", (evt) => {
  libp2p.dial(evt.detail.multiaddrs).catch((err) => {
    console.error("Dial error:", err);
  });
});

libp2p.services.pubsub.subscribe("messages");
libp2p.services.pubsub.subscribe("actions");
libp2p.services.pubsub.subscribe("contexts");
libp2p.services.pubsub.subscribe("metadata");

const port = Number(process.env.FIREHOSE_PORT || 8080);

const wss = new WebSocketServer({ port });
const clients = new Set<WebSocket>();

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log("WebSocket client connected");

  ws.on("close", () => {
    clients.delete(ws);
    console.log("WebSocket client disconnected");
  });

  ws.on("message", async (message: Buffer) => {
    const msg = message.toString();
    const mockData: z.infer<typeof MessageSchema> = {
      from: "user",
      to: "companion_china",
      message: msg,
    };
    console.log("Received message from client:", msg);
    const recipients = await libp2p.services.pubsub.publish(
      "messages",
      new TextEncoder().encode(JSON.stringify(mockData))
    );
    ws.send(`Message published to ${recipients.recipients.length} peers`);
    /*
    try {
      console.log("Received message:", message.toString());
      const data = WSSMessageSchema.safeParse(JSON.parse(message.toString()));
      if (!data.success) {
        throw new Error("Invalid message format");
      }

      switch (data.data.topic) {
        case "messages":
          // メッセージのみPublishする
          const recipients = await libp2p.services.pubsub.publish(
            "messages",
            new TextEncoder().encode(JSON.stringify(data.data.data))
          );
          ws.send(`${recipients.recipients}`);
          break;
        case "actions":
          // Handle action
          break;
        case "contexts":
          // Handle context
          break;
      }
    } catch (error) {
      console.error("Error parsing message:", error);
    }*/
  });
});

libp2p.services.pubsub.addEventListener("message", async (message) => {
  try {
    const data = JSON.parse(new TextDecoder().decode(message.detail.data));
    console.log(data);

    const payload = JSON.stringify(data);
    for (const client of clients) {
      if (client.readyState === 1) {
        client.send(payload);
      }
    }
  } catch (e) {
    console.log(e);
  }
});

console.log(`WebSocket server running on ws://localhost:${port}`);
