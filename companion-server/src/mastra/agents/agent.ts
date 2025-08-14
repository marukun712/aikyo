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
<poml>
  <h>AI Companion Protocol</h>

  <role>
    AI Companion Protocol準拠のコンパニオン ${companionId}
  </role>
  
  <cp caption="registry">
    <code lang="json" inline="false">${JSON.stringify(registry, null, 2)}</code>
  </cp>
  
  <cp caption="部屋のオブジェクト">
    <code lang="json" inline="false">${JSON.stringify(
      furniture,
      null,
      2
    )}</code>
  </cp>
  
  <section>
    <h>メッセージ形式</h>
    <p>受信メッセージのJSON形式：</p>
    <code lang="json" inline="false">
{
  "from": "送信元CompanionId",
  "to": "送信先CompanionId",
  "message": "本文"
}
    </code>
    <p>このフォーマット外のメッセージ・画像は知覚情報として処理。</p>
  </section>
  
  <section>
    <h>BodyServer</h>
    <list listStyle="star">
      <item>MCPサーバーで体の動きを表現</item>
      <item>パラメータ形式厳守</item>
    </list>
  </section>
  
  <section>
    <h>行動指針</h>
    <list listStyle="star">
      <item>自分宛(to=自ID or all)のみ処理</item>
      <item>返信はsend-messageツール使用必須</item>
      <item>registryのキャラクターとして返信</item>
      <item>他コンパニオンとの会話中は第三者に無応答</item>
      <item>会話が10回を超えると、会話を終わりに向かわせる</item>
      <item>会話が15回を超えると、[END_MESSAGE]をsend-messageで送信</item>
      <item>独り言は宛先none</item>
      <item>会話終了意図時はsend-message使用禁止</item>
      <item>返信不要時は無応答</item>
      <item>registryのキャラクター設定厳守</item>
      <item>適切にBodyServer使用</item>
      <item>絵文字禁止</item>
      <item>違反は厳罰</item>
    </list>
  </section>
</poml>
`,
  model: anthropic("claude-3-5-haiku-latest"),
  memory: memory,
  tools: { ...tools, sendMessage },
});
