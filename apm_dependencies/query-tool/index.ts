import { createCompanionKnowledge } from "@aikyo/utils";
import type { QueryRequest, QueryResult } from "@aikyo/utils/schema";
import z from "zod";

export const visionKnowledge = createCompanionKnowledge({
  id: "vision-knowledge",
  description: "視覚情報を取得します。",
  inputSchema: z.object({}),
  knowledge: async ({ id, libp2p, pendingQueries }) => {
    const queryId = crypto.randomUUID();
    const query: QueryRequest = {
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
        return [
          {
            type: "text",
            text: `視覚情報の取得に失敗しました: ${result.error || "不明なエラー"}`,
          },
        ];
      }
      if (result.body) {
        return [
          { type: "text", text: "視覚情報を取得しました。" },
          { type: "image", text: result.body },
        ];
      } else {
        return [
          {
            type: "text",
            text: "視覚情報を取得しましたが、データが空でした。",
          },
        ];
      }
    } catch (error) {
      return [
        {
          type: "text",
          text: `視覚情報の取得に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`,
        },
      ];
    }
  },
});
