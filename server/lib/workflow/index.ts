import { type CompanionCard } from "../../schema/index.ts";
import { convertJsonSchemaToZod } from "zod-from-json-schema";
import { createWorkflow, createStep } from "@mastra/core/workflows";
import { type CoreMessage } from "@mastra/core";
import { z } from "zod";
import { evaluate } from "cel-js";
import { RuntimeContext } from "@mastra/core/runtime-context";
import { CompanionAgent } from "../agents/index.ts";

type AgentType = InstanceType<typeof CompanionAgent>["agent"];

export function createEventWorkflow(
  agent: AgentType,
  runtimeContext: RuntimeContext,
  companionCard: CompanionCard
) {
  const outputSchema = convertJsonSchemaToZod(companionCard.events.params);
  const evaluateStep = createStep({
    id: "evaluate",
    description: "与えられた情報から、状況パラメータの値を設定する。",
    inputSchema: z.union([
      z.string(),
      z.object({ image: z.string(), mimeType: z.string() }),
    ]),
    outputSchema: z.object({
      output: outputSchema,
    }),
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

  const runStep = createStep({
    id: "run",
    description: "状況パラメータから実行するツールを特定する",
    inputSchema: z.object({
      output: outputSchema,
    }),
    outputSchema: z.string(),
    execute: async ({ inputData }) => {
      const { output } = inputData;
      console.log(inputData);
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
      const result = `以下の指示に従い、適切なツールを実行してください。\n${toolInstructions}また、必要なら適切なKnowledgeを参照してください。`;
      return result;
    },
  });

  return createWorkflow({
    id: "event-workflow",
    inputSchema: z.union([
      z.string(),
      z.object({ image: z.string(), mimeType: z.string() }),
    ]),
    outputSchema: z.string(),
  })
    .then(evaluateStep)
    .then(runStep)
    .commit();
}
