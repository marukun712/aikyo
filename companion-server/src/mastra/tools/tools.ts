import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { client, mainTopic } from "../index.ts";
import { agent, companionId, room } from "../agents/agent.ts";
import { randomUUID } from "crypto";

let currentTopic: string | null = null;
let count = 0;

function getRandomInt(min: number, max: number) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
}

const MessageSchema = z.object({
  from: z.string(),
  message: z.string(),
});

export const sendMessage = createTool({
  id: "send-message",
  inputSchema: z.object({
    topicId: z.string(),
    message: z.string(),
  }),
  description: "メッセージを送信します。",
  execute: async ({ context: { topicId, message } }) => {
    try {
      if (count >= 5) {
        const data = {
          id: currentTopic,
          description: "トピック閉鎖",
          event: "close",
        };
        client.publish(mainTopic, JSON.stringify(data));
        count = 0;
      }
      const data = { from: companionId, message };
      console.log(data);
      client.publish(`messages/${room}/topic/${topicId}`, JSON.stringify(data));
      count++;
      return { result: "正常にメッセージが送信されました。" };
    } catch (e) {
      return { result: e };
    }
  },
});

export const openTopic = createTool({
  id: "open-topic",
  inputSchema: z.object({
    description: z.string(),
  }),
  description: "トピックを開設します。",
  execute: async ({ context: { description } }) => {
    try {
      const id = randomUUID();
      const data = { id, description, event: "open" };
      console.log("トピックを開設しました。");
      client.publish(mainTopic, JSON.stringify(data));
      return { result: "正常にトピックを開設しました。" };
    } catch (e) {
      return { result: e };
    }
  },
});

export const closeTopic = createTool({
  id: "close-topic",
  inputSchema: z.object({
    id: z.string(),
    description: z.string(),
  }),
  description: "トピックを閉鎖します。",
  execute: async ({ context: { id, description } }) => {
    try {
      const data = { id, description, event: "close" };
      console.log("トピックを閉鎖しました。");
      client.publish(mainTopic, JSON.stringify(data));
      return { result: "正常にトピックを閉鎖しました。" };
    } catch (e) {
      return { result: e };
    }
  },
});

export const joinTopic = createTool({
  id: "join-topic",
  inputSchema: z.object({
    topicId: z.string(),
  }),
  description: "トピックに参加します。",
  execute: async ({ context: { topicId } }) => {
    try {
      count = 0;
      client.unsubscribe(`messages/${room}/topic/${currentTopic}`);
      currentTopic = topicId;
      client.subscribe(`messages/${room}/topic/${topicId}`);
      client.on("message", async (message, payload) => {
        if (message === `messages/${room}/topic/${topicId}`) {
          const parsed = MessageSchema.safeParse(
            JSON.parse(payload.toString())
          );
          if (!parsed.success) {
            throw new Error("メッセージのスキーマが不正です。");
          }

          if (parsed.data.from === companionId) return;

          await new Promise((resolve) =>
            setTimeout(resolve, getRandomInt(5000, 20000))
          );

          const res = await agent.generate(
            JSON.stringify(parsed.data, null, 2),
            {
              resourceId: "user",
              threadId: "thread",
            }
          );
          console.log(res.text);
        }
      });
      console.log("トピックに参加しました。");
      return { result: "正常にトピックに参加しました。" };
    } catch (e) {
      return { result: e };
    }
  },
});

export const leaveTopic = createTool({
  id: "leave-topic",
  inputSchema: z.object({
    topicId: z.string(),
  }),
  description: "現在のトピックから離脱します。",
  execute: async ({ context: { topicId } }) => {
    try {
      count = 0;
      client.unsubscribe(`messages/${room}/topic/${topicId}`);
      console.log("トピックから離脱しました。");
      return { result: "正常にトピックから離脱しました。" };
    } catch (e) {
      return { result: e };
    }
  },
});
