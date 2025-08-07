import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import fs from "fs";
import { AiCompanionSchema, type AiCompanion } from "./schema";

const app = express();
app.use(express.json());

const companions = new Map<string, AiCompanion>();
const dirPath = "../agents";
const fileNames = fs.readdirSync(dirPath);

fileNames.forEach((fileName) => {
  const file = fs.readFileSync([dirPath, fileName].join("/"), "utf8");
  const parsed = AiCompanionSchema.safeParse(JSON.parse(file));
  if (parsed.success) {
    companions.set(parsed.data.metadata.id, parsed.data);
  } else {
    console.error(parsed.error);
  }
});

const json: AiCompanion[] = [];
companions.forEach((companion) => {
  json.push(companion);
});

const server = new McpServer({
  name: "AICompanionServer",
  version: "1.0.0",
});

server.registerResource(
  "registry",
  "registry://main",
  {
    title: "Registry",
    description: "レジストリサーバーに登録されているコンパニオンの一覧",
    mimeType: "text/plain",
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        text: JSON.stringify(json, null, 2),
      },
    ],
  })
);

const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

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

app.listen(3000);
