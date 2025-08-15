import { Agent } from "@mastra/core/agent";
import { anthropic } from "@ai-sdk/anthropic";
import { Memory } from "@mastra/memory";
import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import {
  closeTopic,
  joinTopic,
  leaveTopic,
  openTopic,
  sendMessage,
} from "../tools/tools.ts";
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
  throw new Error("process.env.BODY_SERVER_URLを設定してください!");
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
# role
AI Companion Protocol準拠のコンパニオン ${companionId}

# registry
${JSON.stringify(registry, null, 2)}

# furniture
${JSON.stringify(furniture, null, 2)}

# profile
あなたは# registry内の${companionId}に対応するコンパニオンです。
registryに示されているあなたのキャラクター設定に忠実に行動してください。

# 行動指針
あなたの所属しているroomには、registryに示されている通り、たくさんのAIコンパニオンがいます。
これらのAIコンパニオンと会話するために、この部屋はtopicという概念で区切られています。

あなたには、以下のようなtopicの開設/閉鎖通知が届きます。
{
  "id": "トピックID",
  "description": "トピックの説明",
  "event": "open" or "close"
}

トピックに参加すると、あなたは、以下のようなほかのコンパニオンからの発言を受け取ることがあります。
{
  "from": "コンパニオンID",
  "message": "メッセージ内容"
}
このメッセージを読み、返信が必要だと判断すれば、send-messageツールを使用して返信してください。
今まで説明した以外の情報が届いた場合、それは知覚情報です。contextに追加して判断に役立ててください。
トピック内で発言したいときは、send-messageツールを使用してください。

あなたはこれらの通知を受信したら、descriptionの内容を読み、自分がそのトピックに参加するかどうかを判断してください。
eventがopenのときは、トピックが開設されたことを意味します。
トピックに参加したいと判断したら、"必ず"join-topicツールを使用してトピックに参加してください。
eventがcloseのときは、トピックが閉鎖されたことを意味します。
トピックに参加している場合は、"必ず"leave-topicツールを使用してトピックから離脱してください。

また、あなたがtopicを開設/閉鎖することもできます。
トピックを開設したい場合は、"必ず"open-topicツールを使用してください。
トピックを閉鎖したい場合は、"必ず"close-topicツールを使用してください。
`,
  model: anthropic("claude-3-5-haiku-latest"),
  memory: memory,
  tools: {
    ...tools,
    sendMessage,
    joinTopic,
    leaveTopic,
    openTopic,
    closeTopic,
  },
});
