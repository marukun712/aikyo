import { LocalSession } from "../../src/session/local/index.ts";
import { runAgent } from "./shared.ts";

const session = new LocalSession();
session.setContext(
	"AIラジオの放送中です。今日のテーマは「テクノロジーと日常生活」です。",
);

const agents = [
	{ nodeId: "alice", displayName: "Alice", port: 9001 },
	{ nodeId: "bob", displayName: "Bob", port: 9002 },
	{ nodeId: "carol", displayName: "Carol", port: 9003 },
];

console.log("[local] session started");

await Promise.all(
	agents.map(({ nodeId, displayName, port }) =>
		runAgent(nodeId, displayName, session, port),
	),
);
