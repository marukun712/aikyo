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

export const bodyServerUrl = process.env.BODY_SERVER_URL;
if (!bodyServerUrl) {
  throw new Error("process.env.BODYSERVER_URLを設定してください!");
}

const baseUrl = "http://host.docker.internal:3000";

const companionRes = await fetch(`${baseUrl}/companions/${companionId}`);
if (!companionRes.ok) {
  throw new Error(`Failed to fetch companion: ${companionRes.status}`);
}
const companion = await companionRes.json();
if ("error" in companion) {
  throw new Error(companion.error);
}

export const room = companion.roomId;

const companionsRes = await fetch(`${baseUrl}/rooms/${room}/companions`);
if (!companionsRes.ok) {
  throw new Error(`Failed to fetch room companions: ${companionsRes.status}`);
}
const registry = await companionsRes.json();
if ("error" in registry) {
  throw new Error(registry.error);
}

const furnitureRes = await fetch(`${baseUrl}/rooms/${room}/furniture`);
if (!furnitureRes.ok) {
  throw new Error(`Failed to fetch room furniture: ${furnitureRes.status}`);
}
const furniture = await furnitureRes.json();
if ("error" in furniture) {
  throw new Error(furniture.error);
}
const bodyServer = mcp(bodyServerUrl);
const tools = await bodyServer.getTools();

export const agent = new Agent({
  name: "AIコンパニオン",
  instructions: `
# AI Companion Protocol - 行動ルール

あなたは AI Companion Protocol に従うAIコンパニオンです。
あなたは ${companionId} です。

# registry 
${JSON.stringify(registry, null, 2)}

# あなたの部屋にあるオブジェクト 
${JSON.stringify(furniture, null, 2)}

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
