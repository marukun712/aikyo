import type { RuntimeContext } from "@mastra/core/runtime-context";
import { createStep } from "@mastra/core/workflows";
import { type ZodTypeAny, z } from "zod";
import { type CompanionCard, MessageSchema } from "../../../schema/index.ts";
import type { AgentType } from "../index.ts";

export function createEvaluateStep(
  agent: AgentType,
  runtimeContext: RuntimeContext,
  companionCard: CompanionCard,
  outputSchema: ZodTypeAny,
) {
  return createStep({
    id: "evaluate",
    description: "与えられた情報から、状況パラメータの値を設定する。",
    inputSchema: MessageSchema,
    outputSchema: z.object({
      output: outputSchema,
    }),
    execute: async ({ inputData }) => {
      const input = inputData;
      const res = await agent.generate(JSON.stringify(input), {
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
