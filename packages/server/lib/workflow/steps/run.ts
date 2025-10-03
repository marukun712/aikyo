import { createStep } from "@mastra/core/workflows";
import { evaluate } from "cel-js";
import { type ZodTypeAny, z } from "zod";
import type { CompanionCard } from "../../../schema/index.js";

export function createRunStep(
  companionCard: CompanionCard,
  outputSchema: ZodTypeAny,
) {
  return createStep({
    id: "run",
    description: "状況パラメータから実行するツールを特定する",
    inputSchema: z.object({
      output: outputSchema,
    }),
    outputSchema: z.string(),
    execute: async ({ inputData }) => {
      const { output } = inputData;
      const tools = new Map<string, string>();
      // 上に書かれた条件を優先
      companionCard.events.conditions.forEach((condition) => {
        // expression を評価する
        if (evaluate(condition.expression, output)) {
          console.log(condition.expression, "is true");
          condition.execute.forEach((tool) => {
            // すでに tool の実行条件が決まっていれば代入しない
            if (!tools.has(tool.tool.id)) {
              tools.set(tool.tool.id, tool.instruction);
            }
          });
        }
      });
      if (tools.size === 0) {
        return "実行するべきツールはありませんでした。";
      }
      // prompt に成形
      const toolInstructions = Array.from(tools.entries())
        .map(([toolName, instruction]) => `${toolName}: ${instruction}`)
        .join("\n");
      const result = `以下の指示に従い、必ず必要なツールを実行してください。\n${toolInstructions}`;
      return result;
    },
  });
}
