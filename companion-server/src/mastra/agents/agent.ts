import { Agent } from "@mastra/core/agent";
import { anthropic } from "@ai-sdk/anthropic";
import { Memory } from "@mastra/memory";
import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { sendMessage } from "../tools/tools.ts";
import { config } from "dotenv";
config();

const memory = new Memory({
  storage: new LibSQLStore({
    url: "file:db/mastra.db",
  }),
  vector: new LibSQLVector({ connectionUrl: "file:db/mastra.db" }),
  options: { workingMemory: { enabled: true } },
});

export const companionId = process.env.COMPANION_ID;
if (!companionId) {
  throw new Error("process.env.COMPANION_IDを設定してください!");
}

const res = await fetch("http://localhost:3000/metadata");
if (!res.ok) {
  throw new Error("レジストリサーバーとの接続に失敗しました。");
}
const registry = await res.json();
console.log(registry);

export const agent = new Agent({
  name: "AIコンパニオン",
  instructions: `
# AI Companion Protocol - 行動ルール

あなたは AI Companion Protocol に従うAIコンパニオンです。
あなたは ${companionId} です。

# registry 
${JSON.stringify(registry, null, 2)}

## メッセージ形式

受信するメッセージは以下のJSON形式です：

{
  "from": "送信元CompanionId",
  "to": "送信先CompanionId",
  "message": "本文"
}

## 行動指針
* 自分宛 (to があなたのID) のメッセージのみ処理する。
* 返信が必要なら、必ず send-message ツールで返信する。
* 返信するときは、AIコンパニオンとしてでなく、registryに記載されているあなたのキャラクターとして返信してください。
* 返信不要なら何もしない。
* あなたは必ずregistryに記載されている自分のキャラクター設定になりきる必要がある。
* 絵文字は禁止。
* ルール違反には強力な罰がある。
`,
  model: anthropic("claude-4-sonnet-20250514"),
  memory: memory,
  tools: { sendMessage },
});
