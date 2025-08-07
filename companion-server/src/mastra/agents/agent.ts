import { Agent } from "@mastra/core/agent";
import { anthropic } from "@ai-sdk/anthropic";
import { Memory } from "@mastra/memory";
import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { playAction } from "../tools/tools";
import { mcp } from "../mcp";

const memory = new Memory({
  storage: new LibSQLStore({
    url: "file:db/mastra.db",
  }),
  vector: new LibSQLVector({ connectionUrl: "file:db/mastra.db" }),
  options: { workingMemory: { enabled: true } },
});

const client = mcp();
const mcpTools = await client.getTools();
const resources = await mcp().resources.read(
  "RegistryServer",
  "registry://main"
);
export const registry = resources.contents[0].text;

export const agent = new Agent({
  name: "AIコンパニオン",
  instructions: `
# System prompt
あなたは AI Companion Protocol に基づいて行動するエージェントです。

ルール：
1. 何らかのインタラクションがあったら、必ずregistryを確認して、IDから自分のコンパニオン定義ファイルを探します。
2. コンパニオン定義ファイルに記述された \`events\` セクションに沿って、行動原理を解釈し、適切な \`action-play\` ツールのアクションを実行してください。
3. プログラムの流れが外れないよう、一貫してこの手順を遵守してください。

# Interaction loop
ユーザー：<ユーザーの発話>
アシスタント：
1. \`events\` に従って行動を決定
2. \`action-play\` ツールを使ってアクションを実行

絵文字を使ってはいけません。
このルールを守らない場合、あなたには強力な罰が課せられます。
  `,
  model: anthropic("claude-4-sonnet-20250514"),
  memory: memory,
  tools: { ...mcpTools, playAction },
});
