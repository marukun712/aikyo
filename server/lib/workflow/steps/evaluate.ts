import { createStep } from "@mastra/core/workflows";
import { type CoreMessage } from "@mastra/core";
import { z, type ZodTypeAny } from "zod";
import { RuntimeContext } from "@mastra/core/runtime-context";
import { type CompanionCard } from "../../../schema/index.ts";
import { type AgentType } from "../types.ts";

export function createEvaluateStep(
  agent: AgentType,
  runtimeContext: RuntimeContext,
  companionCard: CompanionCard,
  outputSchema: ZodTypeAny,
) {
  return createStep({
    id: "evaluate",
    description: "与えられた情報から、状況パラメータの値を設定する。",
    inputSchema: z.union([z.string(), z.object({ image: z.string(), mimeType: z.string() })]),
    outputSchema: z.object({ output: outputSchema }),
    execute: async ({ inputData }) => {
      const input = inputData;
      let interaction: CoreMessage;
      if (typeof input === "string") {
        interaction = { role: "user", content: input };
      } else {
        interaction = {
          role: "user" as const,
          content: [
            {
              type: "image" as const,
              image: input.image,
            },
          ],
        };
      }

      const res = await agent.generate([interaction], {
        instructions: `
        与えられた入力から、あなたの長期記憶とワーキングメモリを元に、
        ${JSON.stringify(companionCard.events.params, null, 2)}
        に適切なパラメータを代入して返却してください。
        `,
        runtimeContext,
        resourceId: "main",
        threadId: "thread",
        output: outputSchema,
      });
      return { output: res.object };
    },
  });
}
