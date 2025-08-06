import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import { z } from "zod";
import Ajv, { type ValidateFunction } from "ajv";
import { AICompanionSchema, JSONRPCRequestSchema } from "../../schema/index.ts";
import { AgentImpl } from "./agents/agent.ts";
import { anthropic } from "@ai-sdk/anthropic";
import { config } from "dotenv";
config();

const ajv = new Ajv();
const app = express();
app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ extended: true, limit: "200mb" }));

const server = new McpServer({
  name: "AICompanionServer",
  version: "1.0.0",
});

let agent: AgentImpl | null = null;

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
  async ({ actionName, parameters }) => {
    console.log(actionName, parameters);

    const validate = actions.get(actionName);
    if (!validate) {
      console.log("Error:そのactionは存在しません");
      return {
        content: [{ type: "text", text: "Error:そのactionは存在しません" }],
      };
    }
    if (!validate(parameters)) {
      console.log("Error:パラメータが不正です");
      return {
        content: [{ type: "text", text: "Error:パラメータが不正です" }],
      };
    }
    const result = {
      action: actionName,
      parameters: parameters,
    };
    console.log("正常にアクションが送信されました。", result);
    return {
      content: [{ type: "text", text: "正常にアクションが送信されました。" }],
    };
  }
);

const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};
/*
const httpServer = http.createServer(app);
const wss = new WebSocketServer({ server: httpServer });
*/

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
    res.status(400).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Bad Request: No valid session ID provided",
      },
    });
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
app.post("/perception", async (req, res) => {
  try {
    console.log(req.body);
    const parsed = JSONRPCRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32600,
          message: "リクエストが不正です。",
        },
      });
    } else {
      const validate = perceptions.get(parsed.data.params.title);
      if (!validate) {
        return res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32600,
            message: "そのperceptionは存在しません。",
          },
        });
      }
      if (!validate(parsed.data.params)) {
        return res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32600,
            message: "リクエストが不正です。",
          },
        });
      } else {
        if (parsed.data.params.format === "image") {
          if (!agent) {
            return res.status(400).json({
              jsonrpc: "2.0",
              error: {
                code: -32000,
                message: "agentが正常に初期化されていません。",
              },
            });
          }

          const chat = await agent.loadImage(parsed.data.params.body);
          console.log(chat.response);
          return res.status(200).json({
            jsonrpc: "2.0",
            result: {
              text: chat.response,
            },
          });
        } else if (
          parsed.data.params.format === "text" ||
          parsed.data.params.format === "object"
        ) {
          if (!agent) {
            return res.status(400).json({
              jsonrpc: "2.0",
              error: {
                code: -32000,
                message: "agentが正常に初期化されていません。",
              },
            });
          }
          const chat = await agent.chat(parsed.data.params.body);
          console.log(chat.response);
          return res.status(200).json({
            jsonrpc: "2.0",
            result: {
              text: chat.response,
            },
          });
        }
      }
    }
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "エラーが発生しました。",
      },
    });
  }
});

app.listen(3000, async () => {
  const llm = anthropic("claude-4-sonnet-20250514");
  agent = await AgentImpl.create(
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
});
