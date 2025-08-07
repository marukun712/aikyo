import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { client } from "..";

export const playAction = createTool({
  id: "play-action",
  inputSchema: z.object({
    name: z.string(),
    params: z.record(z.any()),
  }),
  description: `アクションを送信します。`,
  execute: async ({ context: { name, params } }) => {
    try {
      const data = { name, params };
      client.publish("actions", JSON.stringify(data));
      return { result: "正常にアクションが送信されました。" };
    } catch (e) {
      return { result: e };
    }
  },
});
