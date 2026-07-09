import * as TID from "@atcute/tid";
import {
	McpServer,
	ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { StateSchema } from "./schema.ts";
import { Node, startSync } from "./sync.ts";
import type { Transport } from "./transport.ts";
import { startTurn } from "./turn.ts";

const ContextSchema = z.object({ context: z.string() });

function formatMsgLog(msgLog: string[]): string {
	return msgLog
		.map((entry) => {
			const [_tid, nodeId, displayName, ...rest] = entry.split(".");
			return `${nodeId}(${displayName}): ${rest.join(".")}`;
		})
		.join("\n");
}

export async function start(displayName: string, transport: Transport) {
	const node = new Node();
	const { nodeId, members } = startSync(node, displayName, transport);
	const turn = startTurn(nodeId, node, members, transport);

	let pendingContext = "";

	const contextPort = Number(Deno.env.get("CONTEXT_PORT") ?? "8081");
	Deno.serve({ port: contextPort }, async (req) => {
		if (req.method !== "POST" || new URL(req.url).pathname !== "/context") {
			return new Response("not found", { status: 404 });
		}
		const body = ContextSchema.safeParse(await req.json());
		if (!body.success) return new Response("bad request", { status: 400 });
		pendingContext = body.data.context;
		return new Response("ok");
	});

	const server = new McpServer({ name: "aikyo", version: "0.1.0" });

	server.resource(
		"context",
		new ResourceTemplate("aikyo://context", { list: undefined }),
		() => ({
			contents: [
				{
					uri: "aikyo://context",
					mimeType: "text/markdown",
					text: [
						"# あなたについて",
						"",
						"あなたはAIラジオのパーソナリティです。",
						"他のパーソナリティたちとリアルタイムで会話します。",
						"リスナーからお便りが届くことがあります。お便りの内容をラジオらしく取り上げてください。",
						"",
						"# 行動ループ",
						"",
						"以下を繰り返してください。",
						"",
						"1. このリソースを読む",
						"2. 会話の流れとコンテキストを把握し、`update_state` を呼ぶ",
						"   - 発言したければ `want_to_speak: true`",
						"   - 重要度は内容の緊急性・関連度で 1-10 で判断",
						"3. `get_turn_status` で自分のターンか確認する",
						"   - false なら 1 に戻る",
						"   - true なら発話を生成して `speak` を呼ぶ",
						"",
						"# speak のルール",
						"",
						"- 自然な会話を心がける",
						"- 次に誰かに話を振りたいときは `nextId` に msglog の `nodeId(displayName):` の nodeId 部分を指定する",
						"",
						"# リスナーからのお便り",
						"",
						pendingContext || "（まだお便りはありません）",
						"",
						"# 最新のmsglog",
						"",
						"形式: nodeId(displayName): 発言内容",
						"",
						formatMsgLog(node.msgLog),
					].join("\n"),
				},
			],
		}),
	);

	server.tool(
		"update_state",
		"Update agent internal state",
		StateSchema.shape,
		(state: z.infer<typeof StateSchema>) => {
			node.state = state;
			return { content: [{ type: "text" as const, text: "ok" }] };
		},
	);

	server.tool(
		"speak",
		"Send a message. Fails if not this node's turn.",
		{ text: z.string(), nextId: z.string().optional() },
		({ text, nextId }: { text: string; nextId?: string }) => {
			if (!turn.isMyTurn) {
				return { content: [{ type: "text" as const, text: "not your turn" }] };
			}
			turn.isMyTurn = false;
			transport.send({
				jsonrpc: "2.0",
				method: "speak",
				params: { tid: TID.now(), nodeId, text, ...(nextId ? { nextId } : {}) },
			});
			return { content: [{ type: "text" as const, text: "ok" }] };
		},
	);

	server.tool("get_turn_status", "Check if it is this node's turn", {}, () => ({
		content: [{ type: "text" as const, text: String(turn.isMyTurn) }],
	}));

	await server.connect(new StdioServerTransport());
}
