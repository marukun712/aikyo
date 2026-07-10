import * as TID from "@atcute/tid";
import {
	McpServer,
	ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { type AgentState, type Message, StateSchema } from "./core/types.ts";
import type { Session } from "./session/types.ts";

const ContextSchema = z.object({ context: z.string() });

const GUIDE = [
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
	"1. `aikyo://history` を読む",
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
	"- 次に誰かに話を振りたいときは `nextId` を指定する",
	"",
	"# リスナーからのお便り",
	"",
	"リスナーからお便りが届いたら、リスナーネーム ○○さんからのお便りです、と紹介した後、本文を読み上げ、その後にお便りへの感謝と感想を述べましょう。",
].join("\n");

// 決定論的に次の話者のnodeIdを返す。全MCPサーバーが同じ計算をするため通信不要。
function determineNext(
	states: Map<string, AgentState>,
	messages: Message[],
): string | null {
	const last = messages.at(-1);
	if (last?.nextId) return last.nextId;

	const want = [...states.entries()].filter(([, s]) => s.want_to_speak);
	if (want.length === 1) return want[0][0];
	if (want.length > 1) {
		return want.reduce((a, b) =>
			a[1].importance >= b[1].importance ? a : b,
		)[0];
	}

	// 誰も発言したくない場合は直前の発話者が再度話す。
	return last?.nodeId ?? null;
}

export async function start(
	nodeId: string,
	displayName: string,
	session: Session,
) {
	const contextPort = Number(Deno.env.get("CONTEXT_PORT") ?? "8000");
	Deno.serve({ port: contextPort }, async (req) => {
		if (req.method !== "POST" || new URL(req.url).pathname !== "/context") {
			return new Response("not found", { status: 404 });
		}
		const body = ContextSchema.safeParse(await req.json());
		if (!body.success) return new Response("bad request", { status: 400 });
		session.setContext(body.data.context);
		return new Response("ok");
	});

	const server = new McpServer({ name: "aikyo", version: "0.1.0" });

	// guideは静的なので起動時に一度読めばよい。ポーリング不要。
	server.resource(
		"guide",
		new ResourceTemplate("aikyo://guide", { list: undefined }),
		() => ({
			contents: [
				{ uri: "aikyo://guide", mimeType: "text/markdown", text: GUIDE },
			],
		}),
	);

	server.resource(
		"history",
		new ResourceTemplate("aikyo://history", { list: undefined }),
		() => {
			const msgLog = session
				.getMessages()
				.map((m) => `${m.displayName}: ${m.text}`)
				.join("\n");
			const text = [
				"# 現在のコンテキスト",
				"",
				session.getContext() || "(まだコンテキストはありません)",
				"",
				"# 最新のmsglog",
				"",
				msgLog,
			].join("\n");
			return {
				contents: [{ uri: "aikyo://history", mimeType: "text/markdown", text }],
			};
		},
	);

	server.tool(
		"update_state",
		"Update agent internal state",
		StateSchema.shape,
		(state: AgentState) => {
			session.setState(nodeId, state);
			return { content: [{ type: "text" as const, text: "ok" }] };
		},
	);

	server.tool(
		"speak",
		"Send a message. Fails if not this node's turn.",
		{ text: z.string(), nextId: z.string().optional() },
		({ text, nextId }: { text: string; nextId?: string }) => {
			const next = determineNext(session.getStates(), session.getMessages());
			if (next !== nodeId) {
				return { content: [{ type: "text" as const, text: "not your turn" }] };
			}
			session.addMessage({
				tid: TID.now(),
				nodeId,
				displayName,
				text,
				...(nextId ? { nextId } : {}),
			});
			return { content: [{ type: "text" as const, text: "ok" }] };
		},
	);

	server.tool("get_turn_status", "Check if it is this node's turn", {}, () => {
		const next = determineNext(session.getStates(), session.getMessages());
		return {
			content: [{ type: "text" as const, text: String(next === nodeId) }],
		};
	});

	await server.connect(new StdioServerTransport());
}
