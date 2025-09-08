import { createStep } from "@mastra/core/workflows";
import { evaluate } from "cel-js";
import { type ZodTypeAny, z } from "zod";
import type { CompanionCard } from "../../../schema/index.ts";

export function createRunStep(
  companionCard: CompanionCard,
  outputSchema: ZodTypeAny,
) {
  return createStep({
    id: "run",
    description: "状況パラメータから実行するツールを特定する",
    inputSchema: z.object({ output: outputSchema }),
    outputSchema: z.string(),
    execute: async ({ inputData }) => {
      const { output } = inputData;
      const tools = new Map<string, string>();

      companionCard.events.conditions.forEach((condition) => {
        if (evaluate(condition.expression, output)) {
          condition.execute.forEach((tool) => {
            if (!tools.has(tool.tool.id)) {
              tools.set(tool.tool.id, tool.instruction);
            }
          });
        }
      });

      if (tools.size === 0) {
        return "実行するべきツールはありませんでした。";
      }

      const toolInstructions = Array.from(tools.entries())
        .map(([toolName, instruction]) => `${toolName}: ${instruction}`)
        .join("\n");
      const result = `以下の指示に従い、適切なツールを実行してください。\n${toolInstructions}また、必要なら適切なKnowledgeを参照してください。`;
      return result;
    },
  });
}
