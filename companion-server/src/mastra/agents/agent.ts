import { Agent } from "@mastra/core/agent";
import { anthropic } from "@ai-sdk/anthropic";
import { Memory } from "@mastra/memory";
import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { sendMessage } from "../tools/tools.ts";
import { config } from "dotenv";
import { mcp } from "../mcp/index.ts";
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

const bodyServer = mcp("http://localhost:8001/mcp");
const tools = await bodyServer.getTools();

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

## BodyServer
* あなたには、BodyServerというMCPサーバーが与えられている。
* あなたは、言葉だけでは表現できない体の動きを表現したいとき、このサーバーに用意されているMCPツールを使用する。
* 入力パラメータの形式をしっかりと守ること。

## 行動指針
* 自分宛 (to があなたのID または to が all) のメッセージのみ処理する。
* 返信が必要なら、必ず send-message ツールで返信する。
* 返信するときは、AIコンパニオンとしてでなく、registryに記載されているあなたのキャラクターとして返信してください。
* 返信不要なら何もしない。
* あなたは必ずregistryに記載されている自分のキャラクター設定になりきる必要がある。
* 適切なタイミングでBodyServerも使用する。
* 絵文字は禁止。
* 会話をするときは、"必ず"送信 -> 返信が15回を超えないようにしてください。
* ルール違反には強力な罰がある。
`,
  model: anthropic("claude-3-5-haiku-latest"),
  memory: memory,
  tools: { ...tools, sendMessage },
});
