import { type Action, createCompanionAction } from "@aicompanion/core";
import { z } from "zod";
import { companion } from "../companion.ts";

export class MotionDBFetcher {
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

export const motionDBGestureTool = createCompanionAction({
  id: "motion-db-gesture",
  description:
    "MotionDBからあなたの表現したい動きにあったモーションを取得して再生します。",
  topic: "actions",
  inputSchema: z.object({
    prompt: z.string().describe("promptは必ず英語1,2単語で記述してください。"),
  }),
  buildData: async ({ prompt }) => {
    const url = await fetcher.fetchMove(prompt);
    const data: Action = {
      from: companion.metadata.id,
      name: "gesture",
      params: { url },
    };
    return data;
  },
});
