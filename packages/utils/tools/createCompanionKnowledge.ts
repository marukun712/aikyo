import { createTool } from "@mastra/core/tools";
import { isLibp2p, type Libp2p } from "libp2p";
import type { ZodTypeAny, z } from "zod";
import type { Services } from "../lib/services";
import type { QueryResult } from "../schema";

export interface CompanionKnowledgeConfig<T extends z.ZodSchema> {
  id: string;
  description: string;
  inputSchema: T;
  knowledge: (props: {
    input: z.infer<T>;
    id: string;
    companions: Map<string, string>;
    libp2p: Libp2p<Services>;
    pendingQueries: Map<
      string,
      {
        resolve: (value: QueryResult) => void;
        reject: (reason: string) => void;
      }
    >;
  }) =>
    | Promise<
        {
          type: string;
          text: string;
        }[]
      >
    | {
        type: string;
        text: string;
      }[];
}

export function createCompanionKnowledge<T extends ZodTypeAny>({
  id,
  description,
  inputSchema,
  knowledge,
}: CompanionKnowledgeConfig<T>) {
  return createTool({
    id,
    description,
    inputSchema,
    execute: async ({ context, runtimeContext }) => {
      try {
        const libp2p: Libp2p<Services> = runtimeContext.get("libp2p");
        if (!libp2p || !isLibp2p(libp2p)) {
          throw new Error("Error:libp2pが初期化されていません!");
        }
        const id = runtimeContext.get("id");
        if (!id || typeof id !== "string") {
          throw new Error("Error:コンパニオンのidが不正です!");
        }
        const companions = runtimeContext.get("companions");
        if (!(companions instanceof Map)) {
          throw new Error("Error:companionsの形式が不正です!");
        }
        const pendingQueries = runtimeContext.get("pendingQueries");
        if (!(pendingQueries instanceof Map)) {
          throw new Error("Error:pendingQueriesの形式が不正です!");
        }
        const data = await knowledge({
          input: context,
          id,
          companions,
          libp2p,
          pendingQueries,
        });
        return data;
      } catch (e) {
        console.error(e);
        return {
          content: [{ type: "text", text: `知識の取得に失敗しました。${e}` }],
        };
      }
    },
  });
}
