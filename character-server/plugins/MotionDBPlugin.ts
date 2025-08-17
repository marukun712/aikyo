import { createTool } from "@mastra/core/tools";
import z from "zod";
import { libp2p, type Action } from "../index.ts";
import { companion } from "../config/companion.ts";

class MotionDBFetcher {
  url: string;

  constructor(url: string) {
    this.url = url;
  }

  async fetchMove(prompt: string) {
    const res = await fetch(`${this.url}/search?query=${prompt}`);
    const json = await res.json();
    return `${this.url}/motions/${json.id}.fbx`;
  }
}

const fetcher = new MotionDBFetcher("http://localhost:3000");

export const motionDBGestureTool = createTool({
  id: "motion-db-gesture",
  description:
    "MotionDBからあなたの表現したい動きにあったモーションを取得して再生します。",
  inputSchema: z.object({
    prompt: z.string().describe("promptは必ず英語1,2単語で記述してください。"),
  }),
  execute: async ({ context: { prompt } }) => {
    try {
      const url = await fetcher.fetchMove(prompt);
      const data: Action = {
        from: companion.metadata.id,
        name: "gesture",
        params: { url },
      };
      libp2p.services.pubsub.publish(
        "actions",
        new TextEncoder().encode(JSON.stringify(data))
      );
      return {
        content: [{ type: "text", text: "行動が正常に実行されました。" }],
      };
    } catch (e) {
      return {
        content: [
          { type: "text", text: "行動を実行中にエラーが発生しました。" },
        ],
      };
    }
  },
});
