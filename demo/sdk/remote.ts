import { RemoteSession } from "../../src/session/remote/index.ts";
import { WebSocketTransport } from "../../src/session/remote/transport.ts";
import { runAgent } from "./shared.ts";

const RELAY_URL = Deno.env.get("RELAY_URL") ?? "ws://localhost:8080";

const agents = [
	{ nodeId: "alice", displayName: "Alice", port: 9001 },
	{ nodeId: "bob", displayName: "Bob", port: 9002 },
	{ nodeId: "carol", displayName: "Carol", port: 9003 },
];

console.log("[remote] relay:", RELAY_URL);

await Promise.all(
	agents.map(async ({ nodeId, displayName, port }) => {
		const ws = new WebSocket(RELAY_URL);
		const transport = new WebSocketTransport(ws);
		await transport.waitForOpen();

		const session = new RemoteSession(transport);
		session.setContext(
			"AIラジオの放送中です。今日のテーマは「テクノロジーと日常生活」です。",
		);
		session.start();

		await runAgent(nodeId, displayName, session, port);
	}),
);
