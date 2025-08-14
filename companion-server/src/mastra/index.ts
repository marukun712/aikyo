import { serve } from "@hono/node-server";
import { Hono } from "hono";
import z from "zod";
import mqtt from "mqtt";
import { agent, companionId, room } from "./agents/agent.ts";

const app = new Hono();

const MessageSchema = z.object({
  from: z.string(),
  to: z.union([z.enum(["all", "none"]), z.string()]),
  message: z.string(),
});

const PerceptionSchema = z.object({
  to: z.union([z.enum(["all"]), z.string()]),
  type: z.enum(["text", "image"]),
  body: z.string(),
});

export const client = mqtt.connect("mqtt://host.docker.internal:1883");

function getRandomInt(min: number, max: number) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
}

client.on("connect", () => {
  client.subscribe("messages/" + room);
  client.subscribe("perceptions");
});

client.on("message", async (message, payload) => {
  switch (message) {
    case "messages/" + room: {
      try {
        const parsed = MessageSchema.safeParse(JSON.parse(payload.toString()));
        console.log(parsed);
        if (!parsed.success) {
          throw new Error("メッセージのスキーマが不正です。");
        }
        if (
          parsed.data.to === companionId ||
          parsed.data.to === "all" ||
          parsed.data.message !== "[END_MESSAGE]"
        ) {
          console.log("received", companionId);

          await new Promise<void>((resolve, reject) => {
            setTimeout(() => {
              resolve();
            }, getRandomInt(2000, 15000));
          });

          const res = await agent.generate(
            JSON.stringify(parsed.data, null, 2),
            {
              resourceId: "user",
              threadId: "thread",
            }
          );
          console.log(res.text);
        }
      } catch (e) {
        console.log(e);
      }
      break;
    }
    case "perceptions": {
      try {
        const parsed = PerceptionSchema.safeParse(
          JSON.parse(payload.toString())
        );
        console.log(parsed);
        if (!parsed.success) {
          throw new Error("メッセージのスキーマが不正です。");
        }
        if (parsed.data.to === companionId || parsed.data.to === "all") {
          console.log("received", companionId);

          switch (parsed.data.type) {
            case "text": {
              const res = await agent.generate(parsed.data.body, {
                resourceId: "user",
                threadId: "thread",
              });
              console.log(res.text);
              break;
            }
            case "image": {
              const res = await agent.generate(
                [
                  {
                    role: "user",
                    content: [
                      {
                        type: "image",
                        image: `data:image/jpeg;base64,${parsed.data.body}`,
                        mimeType: "image/jpeg",
                      },
                    ],
                  },
                ],
                {
                  resourceId: "user",
                  threadId: "thread",
                }
              );
              console.log(res.text);
              break;
            }
          }
        }
      } catch (e) {
        console.log(e);
      }
    }
  }
});

serve({
  fetch: app.fetch,
  port: 4000,
});
