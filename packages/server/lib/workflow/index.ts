import { createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { convertJsonSchemaToZod } from "zod-from-json-schema";
import { type CompanionCard, MessageSchema } from "../../schema/index.js";
import type { CompanionAgent } from "../agents/index.js";
import { createEvaluateStep } from "./steps/evaluate.js";
import { createRunStep } from "./steps/run.js";

export type AgentType = InstanceType<typeof CompanionAgent>["agent"];

export function createToolInstructionWorkflow(
  agent: AgentType,
  companionCard: CompanionCard,
) {
  const outputSchema = convertJsonSchemaToZod(companionCard.events.params);

  const evaluateStep = createEvaluateStep(agent, companionCard, outputSchema);
  const runStep = createRunStep(companionCard, outputSchema);

  return createWorkflow({
    id: "get-tool-instruction",
    inputSchema: z.object({
      history: z.array(MessageSchema),
    }),
    outputSchema: z.string(),
  })
    .then(evaluateStep)
    .then(runStep)
    .commit();
}
