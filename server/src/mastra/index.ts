import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import { z } from "zod";
import Ajv, { type ValidateFunction } from "ajv";
import {
  AgentInitSchema,
  AICompanionSchema,
  PerceptionSendSchema,
  SubscribeRequestSchema,
} from "../../schema/index.ts";
import { AgentImpl } from "./agents/agent.ts";
import { anthropic } from "@ai-sdk/anthropic";
import { config } from "dotenv";
import http from "http";
import { WebSocketServer } from "ws";
import {
  createJsonRpcError,
  createJsonRpcResult,
  validateWithMap,
} from "../utils/index.ts";
import { SessionManagerImpl } from "./session/index.ts";
config();

//初期化とバリデーション
const ajv = new Ajv();
const app = express();
app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ extended: true, limit: "200mb" }));

const server = new McpServer({
  name: "AICompanionServer",
  version: "1.0.0",
});

const file = await fs.readFile("resources/agent.json", "utf8");
const parsed = AICompanionSchema.safeParse(JSON.parse(file));
if (!parsed.success) {
  console.log(parsed.error);
  throw new Error("agent.jsonのスキーマが不正です。");
}

const actions = new Map<string, ValidateFunction>();
parsed.data.actions.map((action) => {
  const validate = ajv.compile(action);
  actions.set(action.title, validate);
});

const perceptions = new Map<string, ValidateFunction>();
parsed.data.perceptions.map((perception) => {
  const validate = ajv.compile(perception);
  perceptions.set(perception.title, validate);
});

//Sessionの初期化
const sessionManager = new SessionManagerImpl();

//MCPサーバーの初期化
server.registerResource(
  "spec",
  "spec://main",
  {
    title: "AI Companion Protocol Definition",
    description:
      "あなたの実行可能な行動、知覚できる知覚情報、それに基づいた判断基準を示したファイルです。必ずこのファイルの通りに行動すること。",
    mimeType: "text/plain",
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        text: file,
      },
    ],
  })
);

server.registerTool(
  "action-play",
  {
    title: "Play Action",
    description: "アクションを実行します",
    inputSchema: {
      actionName: z.string(),
      parameters: z.any(),
    },
  },
  async ({ actionName, parameters }, { sessionId }) => {
    console.log(actionName, parameters);
    //LLMが送ってきたパラメータをバリデーションする
    const validate = validateWithMap(actions, actionName, parameters);
    if (!validate.valid) {
      console.log(validate.error);
      return {
        content: [
          {
            type: "text",
            text: validate.error,
          },
        ],
      };
    }
    const result = {
      action: actionName,
      parameters: parameters,
    };
    if (!sessionId) {
      console.log("Error:SessionIdが正常に初期化されていません。");
      return {
        content: [
          {
            type: "text",
            text: "Error:SessionIdが正常に初期化されていません。",
          },
        ],
      };
    }
    sessionManager.sendMessage(sessionId, JSON.stringify(result));
    return {
      content: [{ type: "text", text: "正常にアクションが送信されました。" }],
    };
  }
);

//Agentの初期化メソッド
async function initAgent() {
  if (!parsed.data) {
    throw new Error("初期化が完了していません。");
  }
  const llm = anthropic("claude-4-sonnet-20250514");
  const agent = await AgentImpl.create(
    llm,
    { url: "http://localhost:3000" },
    {
      name: parsed.data.name,
      instructions: `
# System prompt
あなたは AI Companion Protocol に基づいて行動するエージェントです。

ルール：
1. ユーザーから何らかのインタラクションがあったら、必ず \`spec://main\` を確認します。
2. \`spec://main\` に記述された \`events\` セクションに沿って、行動原理を解釈し、適切な \`action-play\` ツールのアクションを実行してください。
3. プログラムの流れが外れないよう、一貫してこの手順を遵守してください。

# Interaction loop
ユーザー：<ユーザーの発話>
アシスタント：
1. 「spec://main」を読み込み
2. \`events\` に従って行動を決定
3. \`action-play\` ツールを使ってアクションを実行

このルールを守らない場合、あなたには強力な罰が課せられます。
`,
      database: "file:db/mastra.db",
    }
  );
  const sessionId = agent.mcpClient.sessionIds.vccp;
  sessionManager.addSession(sessionId, agent);

  return sessionId;
}

//MCPトランスポートの初期化
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};
const httpServer = http.createServer(app);
const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (ws) => {
  ws.on("message", (message: string) => {
    console.log(`Received message => ${message}`);
    try {
      const parsed = SubscribeRequestSchema.safeParse(JSON.parse(message));
      if (!parsed.success) {
        return ws.send(
          JSON.stringify(createJsonRpcError("32600", "スキーマが不正です。"))
        );
      }
      sessionManager.connectWebSocket(parsed.data.params.sessionId, ws);
    } catch (e) {
      return ws.send(
        JSON.stringify(createJsonRpcError("32000", "エラーが発生しました。"))
      );
    }
  });
});

app.post("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  let transport: StreamableHTTPServerTransport;
  if (sessionId && transports[sessionId]) {
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        transports[sessionId] = transport;
      },
    });
    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
      }
    };
    await server.connect(transport);
  } else {
    res
      .status(400)
      .json(createJsonRpcError("32600", "SessionIdが指定されていません。"));
    return;
  }
  await transport.handleRequest(req, res, req.body);
});

const handleSessionRequest = async (
  req: express.Request,
  res: express.Response
) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }
  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

app.get("/mcp", handleSessionRequest);
app.delete("/mcp", handleSessionRequest);

app.post("/init", async (req, res) => {
  try {
    console.log(req.body);
    const parsed = AgentInitSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json(createJsonRpcError("32600", "リクエストが不正です。"));
    }
    const sessionId = await initAgent();
    return res.status(200).json(
      createJsonRpcResult({
        sessionId: sessionId,
      })
    );
  } catch (e) {
    return res
      .status(500)
      .json(createJsonRpcError("32000", "エラーが発生しました。"));
  }
});

app.post("/perception", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (sessionId) {
    try {
      console.log(req.body);
      const parsed = PerceptionSendSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json(createJsonRpcError("32600", "リクエストが不正です。"));
      } else {
        const agent = sessionManager.getAgent(sessionId);
        if (!agent) {
          return res
            .status(400)
            .json(
              createJsonRpcError("32600", "Agentが正しく初期化されていません。")
            );
        }
        if (parsed.data.params.format === "image") {
          const chat = await agent.loadImage(parsed.data.params.body);
          console.log(chat.response);
          return res.status(200).json(
            createJsonRpcResult({
              text: chat.response,
            })
          );
        } else if (
          parsed.data.params.format === "text" ||
          parsed.data.params.format === "object"
        ) {
          const chat = await agent.chat(parsed.data.params.body);
          console.log(chat.response);
          return res.status(200).json(
            createJsonRpcResult({
              text: chat.response,
            })
          );
        }
      }
    } catch (e) {
      console.log(e);
      return res
        .status(500)
        .json(createJsonRpcError("32000", "エラーが発生しました。"));
    }
  } else {
    res
      .status(400)
      .json(createJsonRpcError("32000", "SessionIdが指定されていません。"));
  }
});

httpServer.listen(3000);
