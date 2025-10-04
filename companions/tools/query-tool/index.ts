import type { Query } from "@aikyo/server";
import { createCompanionKnowledge } from "@aikyo/utils";
import z from "zod";

export const visionKnowledge = createCompanionKnowledge({
  id: "vision-knowledge",
  description: "目で周りを見ます。",
  inputSchema: z.object({}),
  outputSchema: z.string(),
  knowledge: async ({ id, sendQuery, companionAgent }) => {
    const queryId = crypto.randomUUID();
    const query: Query = {
      jsonrpc: "2.0",
      id: queryId,
      method: "query.send",
      params: {
        from: id,
        type: "vision",
      },
    };
    try {
      const result = await sendQuery(query);
      if (!result.result) {
        return `視覚情報の取得に失敗しました: ${result.error || "不明なエラー"}`;
      }
      if (result.result.body?.image) {
        const res = await companionAgent.agent.generate(
          [
            {
              role: "user" as const,
              content: [
                {
                  type: "image" as const,
                  image: result.result.body.image,
                },
              ],
            },
          ],
          {
            resourceId: "main",
            threadId: "thread",
            instructions:
              "あなたは目で与えられた画像の光景を見ました。自分が見た光景を説明してください。",
            toolChoice: "none",
          },
        );
        return res.text;
      } else {
        return "視覚情報を取得しましたが、データが空でした。";
      }
    } catch (error) {
      return `視覚情報の取得に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`;
    }
  },
});
