import type { LanguageModel } from "@mastra/core/llm";
import { MastraAgentJudge } from "@mastra/evals/judge";
import {
  type Message,
  type StateBody,
  StateBodySchema,
} from "../../../schema/index.js";

const INSTRUCTIONS = `You are an expert in state generation. Based on the given conversation history and your own role, you will reliably determine the next action.`;

const generatePrompt = (id: string, memory: Message[]) => `
Here are the last 5 messages:
${JSON.stringify(memory.slice(-5))}

Your id is ${id}. Please assess your state. Return:

{
  "id": "${id}",
  "state": "speak | listen",
  "importance": "number 0~10",
  "selected": "boolean"
  "closing": "none | pre-closing | closing | terminal"
}
`;

export class StateJudge extends MastraAgentJudge {
  constructor(model: LanguageModel) {
    super("StateJudge", INSTRUCTIONS, model);
  }

  async evaluate(id: string, memory: Message[]): Promise<StateBody> {
    const prompt = generatePrompt(id, memory);
    const result = await this.agent.generate(prompt, {
      output: StateBodySchema,
    });
    return result.object;
  }
}
