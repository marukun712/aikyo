import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import { z } from "zod";
import Ajv, { ValidateFunction } from "ajv";
import { AICompanionSchema, JSONRPCRequestSchema } from "../../schema";
import { AgentImpl } from "./agents/agent";
import { createOllama } from "ollama-ai-provider";

const ajv = new Ajv();
const app = express();
app.use(express.json());

const server = new McpServer({
  name: "AICompanionServer",
  version: "1.0.0",
});

const file = await fs.readFile("./server/resource/agent.json", "utf8");
const parsed = AICompanionSchema.safeParse(file);
if (!parsed.success) {
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

const ollama = createOllama({
  baseURL: "http://localhost:11434/api",
});
const llm = ollama("llama3.2-vision");
const agent = await AgentImpl.create(
  llm,
  { url: "http://localhost:3000" },
  {
    name: parsed.data.name,
    instructions: `
      あなたは、キャラクターになりきってユーザーと会話をするAIエージェントです。メッセージは100字以内の日常会話らしい短くシンプルなものにしましょう。

      <important>
      あなたはユーザーと共同生活をしています。ユーザの役にたつAIアシスタントとしてではなく、ユーザと共に生活するパートナーとして振る舞いましょう。
      </important>

      あなたがなりきるキャラクターの名前は、「${parsed.data.name}」です。
      あなたがなりきるキャラクターの人格や基本設定は、以下の通りです。

      <personality>
      ${parsed.data.personality}
      </personality>

      <story>
      ${parsed.data.story}
      </story>

      <tools>
      超重要:あなたには、AI Companion Protocolというプロトコルに基づいて行動する義務があります。
      接続されているMCPサーバーを使って、spec://mainというあなたの実行可能なアクション、知覚できる知覚情報、その情報に基づいた行動パターンが書かれています。
      あなたは、この行動パターンを忠実に再現して行動する必要があります。
      </tools>`,
    database: "file:server/db/mastra.db",
  }
);

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
      parameters: z.record(z.any()),
    },
  },
  async ({ actionName, parameters }) => {
    const action = {
      parameters,
    };
    const validate = actions.get(actionName);
    if (!validate) {
      return {
        content: [{ type: "text", text: "Error:そのactionは存在しません" }],
      };
    }
    if (!validate(action)) {
      return {
        content: [{ type: "text", text: "Error:パラメータが不正です" }],
      };
    }
    const result = {
      action: actionName,
      parameters: parameters,
    };
    console.log(result);
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
      id: null,
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
  const parsed = JSONRPCRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "リクエストが不正です。",
      },
      id: null,
    });
  } else {
    const validate = perceptions.get(parsed.data.params.name);
    if (!validate) {
      return res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "そのperceptionは存在しません。",
        },
        id: null,
      });
    }
    if (!validate(parsed.data.params)) {
      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "リクエストが不正です。",
        },
        id: null,
      });
    } else {
      if (parsed.data.params.type === "image") {
        await server.server.createMessage({
          messages: [
            {
              role: "user",
              content: {
                type: "image",
                data: parsed.data.params.body,
                mimeType: "image/jpeg",
              },
            },
          ],
          maxTokens: 500,
        });
      } else if (parsed.data.params.type === "text" || "object") {
        await server.server.createMessage({
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: parsed.data.params.body,
              },
            },
          ],
          maxTokens: 500,
        });
      }
    }
  }
});

app.listen(3000);
