import { anthropic } from "@ai-sdk/anthropic";
import { Agent } from "@mastra/core";
import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { Memory } from "@mastra/memory";

//TODO Agentによるメッセージ制御
const memory = new Memory({
  storage: new LibSQLStore({
    url: `file:db/router.db`,
  }),
  vector: new LibSQLVector({
    connectionUrl: `file:db/router.db`,
  }),
  options: {
    workingMemory: { enabled: true },
  },
});

export const agent = new Agent({
  name: "Router Agent",
  instructions: `
  `,
  model: anthropic("claude-4-sonnet-20250514"),
  memory: memory,
});
