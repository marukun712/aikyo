import { createTool } from "@mastra/core/tools";
import type { ZodTypeAny, z } from "zod";

export interface CompanionKnowledgeConfig<T extends z.ZodSchema> {
  id: string;
  description: string;
  inputSchema: T;
  knowledge: (
    input: z.infer<T>,
    id: string,
    companions: Map<string, string>,
  ) => Promise<string> | string;
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
        const id = runtimeContext.get("id");
        if (!id || typeof id !== "string") {
          throw new Error("Error:コンパニオンのidが不正です!");
        }

        const companions = runtimeContext.get("companions");
        if (!(companions instanceof Map)) {
          throw new Error("Error:companionsの形式が不正です!");
        }

        const data = await knowledge(context, id, companions);
        return {
          content: [{ type: "text", text: data }],
        };
      } catch (e) {
        console.error(e);
        return {
          content: [{ type: "text", text: `知識の取得に失敗しました。${e}` }],
        };
      }
    },
  });
}
