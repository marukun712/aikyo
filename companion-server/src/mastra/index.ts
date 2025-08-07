import { serve } from "@hono/node-server";
import { Hono } from "hono";
import z from "zod";
import mqtt from "mqtt";
import { agent, registry } from "./agents/agent";
import { config } from "dotenv";
config();

const app = new Hono();
const companionId = process.env.COMPANION_ID ?? "";

const PerceptionRequestSchema = z.object({
  title: z.string(),
  format: z.enum(["text", "image"]),
  body: z.string(),
});

export const client = mqtt.connect("mqtt://localhost:1883");
client.on("connect", () => {
  client.subscribe("actions");
  client.subscribe("perceptions");
});

client.on("message", (message) => {
  console.log(message.toString());
  agent.generate(message.toString(), {
    context: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "あなたのIDは" +
              companionId +
              "です。registryの定義は以下の通りです。" +
              registry,
          },
        ],
      },
    ],
    resourceId: "user",
    threadId: "thread",
  });
});

serve(app);
