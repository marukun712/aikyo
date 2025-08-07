import { Agent, type LanguageModel } from "@mastra/core";
import { Memory } from "@mastra/memory";
import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { mcp } from "../tools/mcp.ts";
import { MCPClient } from "@mastra/mcp";

interface AgentInterface {
  llm: LanguageModel;
  agent: Agent;
  mcpClient: MCPClient;
  chat: (prompt: string) => Promise<{ response: string }>;
}

export class AgentImpl implements AgentInterface {
  llm: LanguageModel;
  agent: Agent;
  mcpClient: MCPClient;

  private constructor(llm: LanguageModel, agent: Agent, mcpClient: MCPClient) {
    this.llm = llm;
    this.agent = agent;
    this.mcpClient = mcpClient;
  }

  static async create(
    llm: LanguageModel,
    mcpConfig: { id: string; url: string },
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

    const mcpClient = mcp(mcpConfig.id, mcpConfig.url);
    const tools = await mcpClient.getTools();

    const agent = new Agent({
      name: config.name,
      instructions: config.instructions,
      model: llm,
      memory: memory,
      tools: tools,
    });

    return new AgentImpl(llm, agent, mcpClient);
  }

  async chat(prompt: string): Promise<{ response: string }> {
    const resources = await this.mcpClient.resources.read(
      "vccp",
      "spec://main"
    );

    const result = await this.agent.generate(prompt, {
      context: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "spec://mainの定義は以下の通りです。" +
                resources.contents[0].text,
            },
          ],
        },
      ],
      resourceId: "user",
      threadId: "thread",
    });
    return {
      response: result.text,
    };
  }

  async loadImage(base64: string): Promise<{ response: string }> {
    const resources = await this.mcpClient.resources.read(
      "vccp",
      "spec://main"
    );

    const result = await this.agent.generate(
      [
        {
          role: "user",
          content: [
            {
              type: "image",
              image: `data:image/jpeg;base64,${base64}`,
              mimeType: "image/jpeg",
            },
          ],
        },
      ],
      {
        context: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "spec://mainの定義は以下の通りです。" +
                  resources.contents[0].text,
              },
            ],
          },
        ],
        resourceId: "user",
        threadId: "thread",
      }
    );
    return {
      response: result.text,
    };
  }
}
