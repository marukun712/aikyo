import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import z from "zod";
import mqtt from "mqtt";

const app = express();
app.use(express.json());

const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

const server = new McpServer({
  name: "BodyServer",
  version: "1.0.0",
});

export const client = mqtt.connect("mqtt://localhost:1883");
client.on("connect", () => {
  client.subscribe("actions");
});

const Response = z.object({ file: z.string() });

export const generateMotion = async (prompt: string) => {
  const res = await fetch("http://100.73.74.135:8000/t2m", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: prompt }),
  });

  if (!res.ok) {
    throw new Error("Motion generation failed.");
  }

  const file = await res.json();
  const parsed = Response.safeParse(file);

  if (parsed.success) {
    return parsed.data.file;
  } else {
    throw new Error("Invalid Schema.");
  }
};

server.registerTool(
  "move",
  {
    title: "Move",
    description: "場所を移動する",
    inputSchema: {
      id: z.string().uuid(),
      x: z.number(),
      y: z.number(),
      z: z.number(),
    },
  },
  async ({ id, x, y, z }) => {
    try {
      const data = {
        from: id,
        name: "move",
        params: {
          x,
          y,
          z,
        },
      };
      console.log(data);
      client.publish("actions", JSON.stringify({ data }));
      return {
        content: [
          {
            type: "text",
            text: "行動が正常に実行されました。",
          },
        ],
      };
    } catch (e) {
      console.error(e);
      return {
        content: [
          {
            type: "text",
            text: "Error: " + e,
          },
        ],
      };
    }
  }
);

server.registerTool(
  "look",
  {
    title: "Look",
    description: "一点を注視する",
    inputSchema: {
      id: z.string().uuid(),
      x: z.number(),
      y: z.number(),
      z: z.number(),
    },
  },
  async ({ id, x, y, z }) => {
    try {
      const data = {
        from: id,
        name: "look",
        params: {
          x,
          y,
          z,
        },
      };
      console.log(data);
      client.publish("actions", JSON.stringify({ data }));
      return {
        content: [
          {
            type: "text",
            text: "行動が正常に実行されました。",
          },
        ],
      };
    } catch (e) {
      console.error(e);
      return {
        content: [
          {
            type: "text",
            text: "Error: " + e,
          },
        ],
      };
    }
  }
);

server.registerTool(
  "animation",
  {
    title: "Animation",
    description:
      "あなたの動きを表現する。プロンプトは必ず英語の短い文章にしてください。",
    inputSchema: {
      id: z.string().uuid(),
      prompt: z.string(),
    },
  },
  async ({ id, prompt }) => {
    console.log(id, prompt);
    try {
      const base64 = await generateMotion(prompt);
      const data = {
        from: id,
        name: "animation",
        params: {
          base64,
        },
      };
      console.log(data);
      client.publish("actions", JSON.stringify({ data }));
      return {
        content: [
          {
            type: "text",
            text: "行動が正常に実行されました。",
          },
        ],
      };
    } catch (e) {
      console.error(e);
      return {
        content: [
          {
            type: "text",
            text: "Error: " + e,
          },
        ],
      };
    }
  }
);

app.post("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId: string) => {
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

app.listen(8001, () => {
  console.log("server started and listening on http://localhost:8001");
});
