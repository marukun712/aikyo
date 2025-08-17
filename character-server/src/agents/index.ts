import { Agent } from "@mastra/core/agent";
import { anthropic } from "@ai-sdk/anthropic";
import { Memory } from "@mastra/memory";
import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { config } from "dotenv";
import { companion } from "../../config/companion.ts";
config();

const memory = new Memory({
  storage: new LibSQLStore({
    url: "file:db/mastra.db",
  }),
  vector: new LibSQLVector({ connectionUrl: "file:db/mastra.db" }),
  options: { workingMemory: { enabled: true } },
});

export const agent = new Agent({
  name: companion.metadata.name,
  instructions: `
  あなたのメタデータ
  ${JSON.stringify(companion.metadata, null, 2)}
  このメタデータに記載されているキャラクター情報、口調などに忠実に従ってください。

  あなたには、contextデータがネットワークから渡されます。

  このcontextを長期記憶に保存し、必要であればツールを実行してください。
  "絶対に"、ツールを使用する、のようなメタ的な発言をしてはいけません。
  [LOG]がついている文章は、あなたに情報を与えるためのものであり、"絶対に"ツールを使用してはいけません。
`,
  model: anthropic("claude-4-sonnet-20250514"),
  memory: memory,
  tools: companion.actions,
});
