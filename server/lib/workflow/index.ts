import type { RuntimeContext } from "@mastra/core/runtime-context";
import { createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { convertJsonSchemaToZod } from "zod-from-json-schema";
import { type CompanionCard, MessageSchema } from "../../schema/index.ts";
import type { CompanionAgent } from "../agents/index.ts";
import { createEvaluateStep } from "./steps/evaluate.ts";
import { createRunStep } from "./steps/run.ts";

export type AgentType = InstanceType<typeof CompanionAgent>["agent"];

export function createToolInstructionWorkflow(
  agent: AgentType,
  runtimeContext: RuntimeContext,
  companionCard: CompanionCard,
) {
  const outputSchema = convertJsonSchemaToZod(companionCard.events.params);

  const evaluateStep = createEvaluateStep(
    agent,
    runtimeContext,
    companionCard,
    outputSchema,
  );
  const runStep = createRunStep(companionCard, outputSchema);

  return createWorkflow({
    id: "get-tool-instruction",
    inputSchema: MessageSchema,
    outputSchema: z.string(),
  })
    .then(evaluateStep)
    .then(runStep)
    .commit();
}
