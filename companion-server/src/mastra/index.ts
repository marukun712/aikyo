import { serve } from "@hono/node-server";
import { Hono } from "hono";
import z from "zod";
import mqtt from "mqtt";
import { agent, companionId } from "./agents/agent.ts";

const app = new Hono();

const MessageSchema = z.object({
  from: z.string(),
  to: z.union([z.enum(["all"]), z.string()]),
  message: z.string(),
});

export const client = mqtt.connect("mqtt://relay-server:1883");

client.on("connect", () => {
  client.subscribe("messages");
});

client.on("message", async (message, payload) => {
  try {
    const parsed = MessageSchema.safeParse(JSON.parse(payload.toString()));
    console.log(parsed);
    if (!parsed.success) {
      throw new Error("メッセージのスキーマが不正です。");
    }
    if (parsed.data.to === companionId || parsed.data.to === "all") {
      console.log("received", companionId);
      const res = await agent.generate(JSON.stringify(parsed.data, null, 2), {
        resourceId: "user",
        threadId: "thread",
      });
      console.log(res.text);
    }
  } catch (e) {
    console.log(e);
  }
});

serve({ fetch: app.fetch, port: process.env.PORT ?? 4000 });
