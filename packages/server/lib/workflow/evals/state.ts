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
${memory
  .slice(-5)
  .map((m) => JSON.stringify(m, null, 2))
  .join("\n")}

Your id is ${id}. Please assess your state. Return the following state information in JSON format:

from: ${id}
messageId: the ID of the message to be processed
state: "speak" or "listen" (whether you want to speak next or adopt a listening stance)
importance: a number from 0–10 (how important your next utterance is in the context of the conversation)
selected: boolean (whether the previous speaker’s utterance explicitly solicited you to speak)
`;

export class StateJudge extends MastraAgentJudge {
  constructor(model: LanguageModel) {
    super("StateJudge", INSTRUCTIONS, model);
  }

  async evaluate(
    id: string,
    memory: Message[],
  ): Promise<Omit<StateBody, "closing">> {
    const prompt = generatePrompt(id, memory);
    const result = await this.agent.generate(prompt, {
      output: StateBodySchema.omit({ closing: true }),
    });

    return result.object;
  }
}
