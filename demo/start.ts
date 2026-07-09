const PROJECT_ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const RELAY_URL = "ws://localhost:8080";

const AGENTS = [
	{ name: "Alice", contextPort: 8081, persona: "明るく元気なパーソナリティ" },
	{ name: "Bob", contextPort: 8082, persona: "落ち着いた知的なパーソナリティ" },
	{ name: "Carol", contextPort: 8083, persona: "ユーモラスで親しみやすいパーソナリティ" },
];

for (const agent of AGENTS) {
	const configPath = `/tmp/aikyo-${agent.name}.json`;
	await Deno.writeTextFile(
		configPath,
		JSON.stringify({
			mcpServers: {
				aikyo: {
					command: "deno",
					args: [
						"run",
						"--allow-net",
						"--allow-env",
						"--allow-read",
						`${PROJECT_ROOT}/main.ts`,
						agent.name,
						RELAY_URL,
					],
					env: { CONTEXT_PORT: String(agent.contextPort) },
				},
			},
		}),
	);

	(async () => {
		while (true) {
			const proc = new Deno.Command("claude", {
				args: [
					"-p",
					`あなたは${agent.persona}の${agent.name}です。aikyo://contextリソースを読み、行動ループを開始してください。`,
					"--mcp-config",
					configPath,
					"--strict-mcp-config",
					"--allowedTools",
					"mcp__aikyo__update_state,mcp__aikyo__speak,mcp__aikyo__get_turn_status",
				],
				stdout: "null",
				stderr: "null",
			}).spawn();
			await proc.status;
			await new Promise<void>((r) => setTimeout(r, 2000));
		}
	})();
}

const ws = new WebSocket(RELAY_URL);
await new Promise<void>((resolve, reject) => {
	ws.onopen = () => resolve();
	ws.onerror = () => reject(new Error("relay connection failed"));
});

let started = false;
ws.onmessage = (e) => {
	const msg = JSON.parse(e.data);
	if (msg.method === "heartbeat" && !started) {
		started = true;
		ws.send(JSON.stringify({ jsonrpc: "2.0", method: "speaker_assign", params: { nodeId: msg.params.nodeId } }));
	}
};

console.log("agents starting. type a letter and press Enter to send:");

async function* readLines() {
	const reader = Deno.stdin.readable
		.pipeThrough(new TextDecoderStream())
		.getReader();
	let buf = "";
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		buf += value;
		const lines = buf.split("\n");
		buf = lines.pop() ?? "";
		for (const line of lines) yield line;
	}
}

for await (const line of readLines()) {
	const text = line.trim();
	if (!text) continue;
	await Promise.allSettled(
		AGENTS.map((a) =>
			fetch(`http://localhost:${a.contextPort}/context`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ context: text }),
			}),
		),
	);
}
