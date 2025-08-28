import { createTool } from "@mastra/core/tools";
import { MessageSchema } from "../../schema/index.ts";

export const talkTool = createTool({
  id: "talk",
  inputSchema: MessageSchema,
  description: `他のコンパニオンに話しかけます。`,
  execute: async ({ context }) => {
    const res = await fetch("http://localhost:4000/router", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(context),
    });
    if (!res.ok) {
      const json = await res.json();
      return {
        content: [
          { type: "text", text: "ツールの実行に失敗しました" + json.error },
        ],
      };
    }
    const json = await res.json();
    return {
      content: [{ type: "text", text: json }],
    };
  },
});
