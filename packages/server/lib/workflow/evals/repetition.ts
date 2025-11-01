import type { MetricResult } from "@mastra/core";
import type { LanguageModel } from "@mastra/core/llm";
import { MastraAgentJudge } from "@mastra/evals/judge";
import { z } from "zod";

const INSTRUCTIONS = `You are a repetition detection expert. Evaluate the messages in a conversation and score how repetitive they are. If they are identical or nearly identical, score close to 1. If they are all unique, score 0.`;

const generatePrompt = (memory: string[]) => `
Here are the last 5 messages:
${JSON.stringify(memory.slice(-5))}

Evaluate how repetitive these messages are.

Return:
{
  "score": number (0 to 1),
  "info": {
    "reason": string,
  }
}
`;

export class RepetitionJudge extends MastraAgentJudge {
  constructor(model: LanguageModel) {
    super("RepetitionJudge", INSTRUCTIONS, model);
  }

  async evaluate(memory: string[]): Promise<MetricResult> {
    const prompt = generatePrompt(memory);
    const result = await this.agent.generate(prompt, {
      output: z.object({
        score: z.number().min(0).max(1),
        info: z.object({
          reason: z.string(),
        }),
      }),
    });

    return result.object;
  }
}
