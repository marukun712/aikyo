import { Agent, type LanguageModel } from "@mastra/core";
import { Memory } from "@mastra/memory";
import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { mcp } from "../tools/mcp.ts";

interface AgentInterface {
  llm: LanguageModel;
  agent: Agent;
  chat: (prompt: string) => Promise<{ response: string }>;
}

export class AgentImpl implements AgentInterface {
  llm: LanguageModel;
  agent: Agent;

  private constructor(llm: LanguageModel, agent: Agent) {
    this.llm = llm;
    this.agent = agent;
  }

  static async create(
    llm: LanguageModel,
    mcpConfig: { url: string },
    config: { name: string; instructions: string; database: string }
  ): Promise<AgentImpl> {
    const memory = new Memory({
      storage: new LibSQLStore({
        url: config.database,
      }),
      vector: new LibSQLVector({
        connectionUrl: config.database,
      }),
      options: {
        workingMemory: {
          enabled: true,
        },
      },
    });

    const tools = await mcp(mcpConfig.url).getTools();

    const agent = new Agent({
      name: config.name,
      instructions: config.instructions,
      model: llm,
      memory: memory,
      tools: tools,
    });

    return new AgentImpl(llm, agent);
  }

  async chat(prompt: string) {
    const result = await this.agent.generate(prompt, {
      resourceId: "user",
      threadId: "thread",
    });

    return {
      response: result.text,
    };
  }
}
