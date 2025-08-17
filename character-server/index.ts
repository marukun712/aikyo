import { z } from "zod";
import { agent } from "./src/agents/index.ts";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { serve } from "@hono/node-server";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { createLibp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import { identify } from "@libp2p/identify";
import { mdns } from "@libp2p/mdns";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { companion } from "./config/companion.ts";

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
    identify: identify({
      agentVersion: JSON.stringify(companion.metadata, null, 2),
    }),
  },
});

libp2p.addEventListener("peer:discovery", (evt) => {
  libp2p.dial(evt.detail.multiaddrs);
});

const companions = new Map<string, string>();

libp2p.addEventListener("peer:identify", async (evt) => {
  try {
    const { agentVersion, peerId } = evt.detail;
    if (
      !agentVersion ||
      companions.has(peerId.toString()) ||
      !JSON.parse(agentVersion)
    )
      return;
    companions.set(peerId.toString(), agentVersion);
    const res = await agent.generate(
      `[LOG]${agentVersion}がネットワークに参加してきました。`,
      { resourceId: "user", threadId: "thread" }
    );
    console.log(res.text);
    console.log(
      `Identified peer ${peerId.toString()} with metadata:`,
      agentVersion
    );
  } catch (e) {}
});

libp2p.addEventListener("peer:disconnect", async (evt) => {
  try {
    const peerIdStr = evt.detail.toString();
    const agentVersion = companions.get(peerIdStr);
    if (!companions.has(peerIdStr)) return;
    const res = await agent.generate(
      `[LOG]${agentVersion}がネットワークから離脱しました。`,
      { resourceId: "user", threadId: "thread" }
    );
    console.log(res.text);
    console.log(`Peer disconnected: ${peerIdStr}, metadata was:`, agentVersion);
    companions.delete(peerIdStr);
  } catch (e) {}
});

libp2p.services.pubsub.subscribe("actions");
libp2p.services.pubsub.subscribe("contexts");

function buildBaseContext() {
  return [
    {
      role: "user" as const,
      content: [
        {
          type: "text" as const,
          text: `
            ${JSON.stringify(companion.events, null, 2)}
            あなたは、この条件に従って与えられたツールを使用する必要があります。
            "絶対に" この条件にないタイミングでツールを使ってはいけません。`,
        },
      ],
    },
  ];
}

async function runAgent(input: string | { image: string; mimeType: string }) {
  let messages;

  if (typeof input === "string") {
    messages = input;
  } else {
    messages = [
      {
        role: "user" as const,
        content: [
          {
            type: "image" as const,
            image: input.image,
            mimeType: input.mimeType,
          },
        ],
      },
    ];
  }

  return agent.generate(messages, {
    context: buildBaseContext(),
    resourceId: "user",
    threadId: "thread",
  });
}

libp2p.services.pubsub.addEventListener("message", async (message) => {
  const topic = message.detail.topic;

  if (topic === "actions") {
    try {
      const data = JSON.parse(new TextDecoder().decode(message.detail.data));
      const parsed = ActionSchema.safeParse(data);

      if (parsed.success) {
        const action = parsed.data;

        if (action.from === companion.metadata.id) {
          return;
        }

        if (action.name === "speak") {
          const contextMessage = `${action.from}が話しかけています: "${action.params.message}"`;

          const isTargeted =
            action.params.target &&
            (action.params.target === companion.metadata.name ||
              action.params.target === companion.metadata.id);
          const isGeneral = !action.params.target;

          if (isTargeted || isGeneral) {
            const result = await runAgent(contextMessage);
            console.log(
              `Processed message from ${action.from}: ${result.text}`
            );
          }
        }
      }
    } catch (error) {
      console.error("Error processing action message:", error);
    }
  } else if (topic === "contexts") {
    try {
      const data = JSON.parse(new TextDecoder().decode(message.detail.data));
      const parsed = ContextSchema.safeParse(data);

      if (parsed.success) {
        const body = parsed.data;

        if (body.type === "text") {
          const result = await runAgent(body.context);
          console.log(result.text);
        } else if (body.type === "image") {
          const result = await runAgent({
            image: `data:image/jpeg;base64,${body.context}`,
            mimeType: "image/jpeg",
          });
          console.log(result.text);
        }
      }
    } catch (error) {
      console.error("Error processing context message:", error);
    }
  }
});

const ActionSchema = z.object({
  from: z.string(),
  name: z.string(),
  params: z.record(z.string(), z.any()),
});
export type Action = z.infer<typeof ActionSchema>;

const ContextSchema = z.object({
  type: z.enum(["image", "text"]),
  context: z.string(),
});
export type Context = z.infer<typeof ContextSchema>;

const app = new Hono();

const route = app.post(
  "/context",
  validator("json", (value, c) => {
    const parsed = ContextSchema.safeParse(value);
    if (!parsed.success) {
      return c.text("Invalid!", 401);
    }
    return parsed.data;
  }),
  async (c) => {
    const body = c.req.valid("json");

    if (body.type === "text") {
      const result = await runAgent(body.context);
      return c.json(
        {
          message: result.text,
        },
        201
      );
    } else if (body.type === "image") {
      const result = await runAgent({
        image: `data:image/jpeg;base64,${body.context}`,
        mimeType: "image/jpeg",
      });
      return c.json(
        {
          message: result.text,
        },
        201
      );
    }
  }
);

export type routeType = typeof route;

serve({ fetch: app.fetch, port: 3000 });
console.log("WebSocket server running on http://localhost:3000");
