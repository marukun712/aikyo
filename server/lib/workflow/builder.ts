import { convertJsonSchemaToZod } from "zod-from-json-schema";
import { createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { RuntimeContext } from "@mastra/core/runtime-context";
import { type CompanionCard } from "../../schema/index.ts";
import { type AgentType } from "./types.ts";
import { createEvaluateStep } from "./steps/evaluate.ts";
import { createRunStep } from "./steps/run.ts";

export function createEventWorkflow(
  agent: AgentType,
  runtimeContext: RuntimeContext,
  companionCard: CompanionCard,
) {
  const outputSchema = convertJsonSchemaToZod(companionCard.events.params);

  const evaluateStep = createEvaluateStep(agent, runtimeContext, companionCard, outputSchema);
  const runStep = createRunStep(companionCard, outputSchema);

  return createWorkflow({
    id: "event-workflow",
    inputSchema: z.union([z.string(), z.object({ image: z.string(), mimeType: z.string() })]),
    outputSchema: z.string(),
  })
    .then(evaluateStep)
    .then(runStep)
    .commit();
}
