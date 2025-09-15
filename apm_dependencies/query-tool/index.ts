import type { Query, QueryResult } from "@aikyo/server";
import { createCompanionKnowledge } from "@aikyo/utils";
import z from "zod";

export const visionKnowledge = createCompanionKnowledge({
  id: "vision-knowledge",
  description: "視覚情報を取得します。",
  inputSchema: z.object({}),
  outputSchema: z.string(),
  knowledge: async ({ id, libp2p, pendingQueries, companionAgent }) => {
    const queryId = crypto.randomUUID();
    const query: Query = {
      id: queryId,
      from: id,
      type: "vision",
    };
    const resultPromise = new Promise<QueryResult>((resolve, reject) => {
      setTimeout(() => {
        pendingQueries.delete(queryId);
        reject(new Error(`クエリがタイムアウトしました`));
      }, 10000);

      pendingQueries.set(queryId, {
        resolve,
        reject,
      });
    });
    libp2p.services.pubsub.publish(
      "queries",
      new TextEncoder().encode(JSON.stringify(query)),
    );
    try {
      const result = await resultPromise;
      if (!result.success) {
        return `視覚情報の取得に失敗しました: ${result.error || "不明なエラー"}`;
      }
      if (result.body) {
        const res = await companionAgent.agent.generate(
          [
            {
              role: "user" as const,
              content: [
                {
                  type: "image" as const,
                  image: result.body,
                },
              ],
            },
          ],
          {
            resourceId: "main",
            threadId: "thread",
            instructions:
              "あなたは画像分析のプロです。与えられた画像の状況について、詳細に説明してください。",
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
