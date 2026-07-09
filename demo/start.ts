const PROJECT_ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const RELAY_URL = "ws://localhost:8080";

type LlmClientName = "claude" | "codex";

const DEBUG_LOG = ["AIKYO_DEBUG_LOG", "AIKYO_DEBUG"]
	.map((key) => Deno.env.get(key)?.toLowerCase())
	.some((value) => value === "1" || value === "true" || value === "yes");

function debugLog(message: string) {
	if (DEBUG_LOG) console.error(`[aikyo:demo] ${message}`);
}

type AgentConfig = {
	name: string;
	contextPort: number;
	persona: string;
	client: LlmClientName;
};

type McpServerSpec = {
	command: string;
	args: string[];
	env: Record<string, string>;
};

type SpawnSpec = {
	command: string;
	args: string[];
	env?: Record<string, string>;
};

interface LlmClient {
	readonly name: LlmClientName;
	buildSpawn(
		agent: AgentConfig,
		prompt: string,
		mcp: McpServerSpec,
	): Promise<SpawnSpec>;
}

function parseClientName(
	value: string | undefined,
	fallback: LlmClientName,
): LlmClientName {
	if (value === "claude" || value === "codex") return value;
	return fallback;
}

function tomlString(value: string): string {
	return JSON.stringify(value);
}

function tomlValue(value: unknown): string {
	if (typeof value === "string") return tomlString(value);
	if (Array.isArray(value)) return `[${value.map(tomlValue).join(", ")}]`;
	if (value && typeof value === "object") {
		return `{ ${Object.entries(value as Record<string, unknown>)
			.map(([key, val]) => `${key} = ${tomlValue(val)}`)
			.join(", ")} }`;
	}
	return String(value);
}

class ClaudeClient implements LlmClient {
	readonly name = "claude" as const;

	async buildSpawn(
		agent: AgentConfig,
		prompt: string,
		mcp: McpServerSpec,
	): Promise<SpawnSpec> {
		const configPath = `/tmp/aikyo-${agent.name}.json`;
		await Deno.writeTextFile(
			configPath,
			JSON.stringify({
				mcpServers: {
					aikyo: mcp,
				},
			}),
		);
		debugLog(`${agent.name}: wrote Claude MCP config to ${configPath}`);

		return {
			command: "claude",
			args: [
				"-p",
				prompt,
				"--mcp-config",
				configPath,
				"--strict-mcp-config",
				"--allowedTools",
				"mcp__aikyo__update_state,mcp__aikyo__speak,mcp__aikyo__get_turn_status",
			],
		};
	}
}

class CodexClient implements LlmClient {
	readonly name = "codex" as const;

	buildSpawn(
		_agent: AgentConfig,
		prompt: string,
		mcp: McpServerSpec,
	): Promise<SpawnSpec> {
		const configOverrides = {
			"mcp_servers.aikyo.command": mcp.command,
			"mcp_servers.aikyo.args": mcp.args,
			"mcp_servers.aikyo.env": mcp.env,
			"mcp_servers.aikyo.default_tools_approval_mode": "approve",
			"mcp_servers.aikyo.enabled_tools": [
				"update_state",
				"speak",
				"get_turn_status",
			],
		};
		const args = ["exec"];
		for (const [key, value] of Object.entries(configOverrides)) {
			args.push("-c", `${key}=${tomlValue(value)}`);
		}
		args.push(prompt);
		return Promise.resolve({ command: "codex", args });
	}
}

const clients: Record<LlmClientName, LlmClient> = {
	claude: new ClaudeClient(),
	codex: new CodexClient(),
};

const defaultClient = parseClientName(Deno.env.get("AIKYO_LLM"), "claude");
const clientOverrides = (Deno.env.get("AIKYO_LLM_CLIENTS") ?? "")
	.split(",")
	.map((v) => v.trim())
	.filter(Boolean);

const AGENTS: AgentConfig[] = [
	{
		name: "Alice",
		contextPort: 8081,
		persona: "明るく元気なパーソナリティ",
		client: defaultClient,
	},
	{
		name: "Bob",
		contextPort: 8082,
		persona: "落ち着いた知的なパーソナリティ",
		client: defaultClient,
	},
	{
		name: "Carol",
		contextPort: 8083,
		persona: "ユーモラスで親しみやすいパーソナリティ",
		client: defaultClient,
	},
].map((agent, index) => ({
	...agent,
	client: parseClientName(clientOverrides[index], agent.client),
}));

function createMcpServerSpec(agent: AgentConfig): McpServerSpec {
	return {
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
	};
}

function createPrompt(agent: AgentConfig): string {
	return `あなたは${agent.persona}の${agent.name}です。aikyo://contextリソースを読み、行動ループを開始してください。`;
}

for (const agent of AGENTS) {
	const client = clients[agent.client];
	const mcp = createMcpServerSpec(agent);
	const prompt = createPrompt(agent);
	debugLog(
		`${agent.name}: client=${client.name} contextPort=${agent.contextPort}`,
	);

	(async () => {
		while (true) {
			const spawn = await client.buildSpawn(agent, prompt, mcp);
			console.log(`starting ${agent.name} with ${client.name}`);
			debugLog(`${agent.name}: spawn ${spawn.command} ${spawn.args.join(" ")}`);
			const proc = new Deno.Command(spawn.command, {
				args: spawn.args,
				env: spawn.env,
				stdin: "null",
				stdout: DEBUG_LOG ? "inherit" : "null",
				stderr: DEBUG_LOG ? "inherit" : "null",
			}).spawn();
			const status = await proc.status;
			debugLog(
				`${agent.name}: exited code=${status.code} success=${status.success}`,
			);
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
		ws.send(
			JSON.stringify({
				jsonrpc: "2.0",
				method: "speaker_assign",
				params: { nodeId: msg.params.nodeId },
			}),
		);
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
