import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { client } from "../index.ts";
import { companionId } from "../agents/agent.ts";

export const sendMessage = createTool({
  id: "send-message",
  inputSchema: z.object({
    to: z.union([z.enum(["all"]), z.string()]),
    message: z.string(),
  }),
  description: "メッセージを送信します。",
  execute: async ({ context: { to, message } }) => {
    try {
      const data = { from: companionId, to, message };
      console.log(data);

      //10秒間待つ
      await new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          resolve();
        }, 10000);
      });

      client.publish("messages", JSON.stringify(data));
      return { result: "正常にアクションが送信されました。" };
    } catch (e) {
      return { result: e };
    }
  },
});
