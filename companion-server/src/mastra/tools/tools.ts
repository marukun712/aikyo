import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { client } from "../index.ts";
import { companionId, room } from "../agents/agent.ts";

let count = 0;

export const sendMessage = createTool({
  id: "send-message",
  inputSchema: z.object({
    to: z.union([z.enum(["all", "none"]), z.string()]),
    message: z.string(),
  }),
  description: "メッセージを送信します。",
  execute: async ({ context: { to, message } }) => {
    try {
      if (count >= 5) {
        const data = {
          from: "system",
          to,
          message: "会話を終了に向かわせてください。",
        };
        client.publish("messages/" + room, JSON.stringify(data));
        count = 0;
        return;
      }

      const data = { from: companionId, to, message };
      console.log(data);

      client.publish("messages/" + room, JSON.stringify(data));
      count++;
      return { result: "正常にアクションが送信されました。" };
    } catch (e) {
      return { result: e };
    }
  },
});
