import * as TID from "@atcute/tid";

const PROJECT_ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const RELAY_URL = "ws://localhost:8080";
const DEBUG =
	isTruthyEnv(Deno.env.get("DEBUG")) ||
	isTruthyEnv(Deno.env.get("AIKYO_DEBUG"));
const AIKYO_TOOLS = ["update_state", "speak", "get_turn_status"] as const;
const HARNESS_NAMES = ["claude", "codex"] as const;

type HarnessName = (typeof HARNESS_NAMES)[number];

type AgentSpec = {
	name: string;
	nodeId: string;
	contextPort: number;
	persona: string;
	harness?: HarnessName;
};

type McpServerDefinition = {
	name: string;
	command: string;
	args: string[];
	env: Record<string, string>;
};

type HarnessInput = {
	agent: AgentSpec;
	prompt: string;
	mcpServer: McpServerDefinition;
	allowedTools: readonly string[];
};

type CommandInvocation = {
	command: string;
	args: string[];
	env?: Record<string, string>;
};

type Harness = {
	name: HarnessName;
	buildInvocation(input: HarnessInput): Promise<CommandInvocation>;
};

const DEFAULT_HARNESS = parseHarnessName(
	Deno.args[0] ?? Deno.env.get("AIKYO_HARNESS") ?? "claude",
);

const AGENTS: AgentSpec[] = [
	createAgent("Alice", 8081, "明るく元気なパーソナリティ"),
	createAgent("Bob", 8082, "落ち着いた知的なパーソナリティ"),
	createAgent("Carol", 8083, "ユーモラスで親しみやすいパーソナリティ"),
];

const HARNESSES: Record<HarnessName, Harness> = {
	claude: {
		name: "claude",
		async buildInvocation({ agent, prompt, mcpServer, allowedTools }) {
			const configPath = `/tmp/aikyo-${agent.name}-claude.json`;
			debugLog(agent.name, `writing claude MCP config: ${configPath}`);
			await Deno.writeTextFile(
				configPath,
				JSON.stringify({
					mcpServers: {
						[mcpServer.name]: {
							command: mcpServer.command,
							args: mcpServer.args,
							env: mcpServer.env,
						},
					},
				}),
			);

			return {
				command: "claude",
				args: [
					"-p",
					prompt,
					"--mcp-config",
					configPath,
					"--strict-mcp-config",
					"--allowedTools",
					allowedTools
						.map((tool) => `mcp__${mcpServer.name}__${tool}`)
						.join(","),
				],
			};
		},
	},
	codex: {
		name: "codex",
		async buildInvocation({ prompt, mcpServer, allowedTools }) {
			return {
				command: "codex",
				args: [
					"--ask-for-approval",
					"never",
					"exec",
					...codexMcpConfigArgs(mcpServer, allowedTools),
					"--sandbox",
					"read-only",
					"-C",
					PROJECT_ROOT,
					prompt,
				],
			};
		},
	},
};

debugLog(
	"main",
	`debug logging enabled (DEBUG=${Deno.env.get("DEBUG") ?? ""}, AIKYO_DEBUG=${Deno.env.get("AIKYO_DEBUG") ?? ""})`,
);
debugLog("main", `default harness: ${DEFAULT_HARNESS}`);
debugLog("main", `relay url: ${RELAY_URL}`);

for (const agent of AGENTS) {
	void runAgent(agent);
}

const ws = new WebSocket(RELAY_URL);
await new Promise<void>((resolve, reject) => {
	ws.onopen = () => {
		debugLog("relay", "connected");
		resolve();
	};
	ws.onerror = () => {
		debugLog("relay", "connection failed");
		reject(new Error("relay connection failed"));
	};
});

let started = false;
ws.onmessage = (e) => {
	debugLog("relay", "message", e.data);
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

console.log(
	`agents starting with ${DEFAULT_HARNESS} harness. type a letter and press Enter to send:`,
);

async function runAgent(agent: AgentSpec) {
	const harness = HARNESSES[agent.harness ?? DEFAULT_HARNESS];
	const mcpServer = createMcpServerDefinition(agent);
	const prompt = createPrompt(agent);
	debugLog(agent.name, `starting agent with ${harness.name} harness`);
	debugLog(agent.name, "MCP server", mcpServer);

	while (true) {
		try {
			debugLog(agent.name, "building harness invocation");
			const invocation = await harness.buildInvocation({
				agent,
				prompt,
				mcpServer,
				allowedTools: AIKYO_TOOLS,
			});
			debugLog(agent.name, "spawning", invocation);
			const proc = new Deno.Command(invocation.command, {
				args: invocation.args,
				env: invocation.env,
				stdout: DEBUG ? "inherit" : "null",
				stderr: DEBUG ? "inherit" : "null",
			}).spawn();
			const status = await proc.status;
			debugLog(agent.name, "process exited", status);
		} catch (error) {
			console.error(`[${agent.name}] ${harness.name} harness failed:`, error);
		}
		debugLog(agent.name, "restarting in 2000ms");
		await new Promise<void>((resolve) => setTimeout(resolve, 2000));
	}
}

function debugLog(scope: string, message: string, data?: unknown) {
	if (!DEBUG) return;
	const prefix = `[aikyo:debug:${scope}]`;
	if (data === undefined) {
		console.error(prefix, message);
		return;
	}
	console.error(prefix, message, stringifyDebugData(data));
}

function stringifyDebugData(data: unknown) {
	return typeof data === "string" ? data : JSON.stringify(data, null, 2);
}

function isTruthyEnv(value: string | undefined) {
	return (
		value !== undefined &&
		!["", "0", "false", "no", "off"].includes(value.toLowerCase())
	);
}

function createAgent(
	name: string,
	contextPort: number,
	persona: string,
	harness?: HarnessName,
): AgentSpec {
	return { name, nodeId: TID.now(), contextPort, persona, harness };
}

function createPrompt(agent: AgentSpec) {
	return `あなたは${agent.persona}の${agent.name}です。あなたのnodeIdは${agent.nodeId}です。aikyo://contextリソースを読み、行動ループを開始してください。`;
}

function createMcpServerDefinition(agent: AgentSpec): McpServerDefinition {
	return {
		name: "aikyo",
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
		env: {
			CONTEXT_PORT: String(agent.contextPort),
			AIKYO_NODE_ID: agent.nodeId,
		},
	};
}

function parseHarnessName(value: string): HarnessName {
	if (HARNESS_NAMES.includes(value as HarnessName)) return value as HarnessName;
	throw new Error(
		`unknown harness: ${value}. expected one of: ${HARNESS_NAMES.join(", ")}`,
	);
}

function codexMcpConfigArgs(
	server: McpServerDefinition,
	allowedTools: readonly string[],
): string[] {
	const serverKey = `mcp_servers.${tomlKey(server.name)}`;
	const args = [
		"-c",
		`${serverKey}.command=${tomlString(server.command)}`,
		"-c",
		`${serverKey}.args=${tomlArray(server.args)}`,
		"-c",
		`${serverKey}.default_tools_approval_mode="approve"`,
		"-c",
		`${serverKey}.enabled_tools=${tomlArray(allowedTools)}`,
	];
	for (const tool of allowedTools) {
		args.push(
			"-c",
			`${serverKey}.tools.${tomlKey(tool)}.approval_mode="approve"`,
		);
	}
	if (Object.keys(server.env).length > 0) {
		args.push("-c", `${serverKey}.env=${tomlInlineTable(server.env)}`);
	}
	return args;
}

function tomlString(value: string): string {
	return JSON.stringify(value);
}

function tomlArray(values: readonly string[]): string {
	return `[${values.map(tomlString).join(", ")}]`;
}

function tomlInlineTable(values: Record<string, string>): string {
	return `{ ${Object.entries(values)
		.map(([key, value]) => `${tomlKey(key)} = ${tomlString(value)}`)
		.join(", ")} }`;
}

function tomlKey(value: string): string {
	return /^[A-Za-z0-9_-]+$/.test(value) ? value : tomlString(value);
}

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
	debugLog("stdin", `injecting context: ${text}`);
	const results = await Promise.allSettled(
		AGENTS.map((a) =>
			fetch(`http://localhost:${a.contextPort}/context`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ context: text }),
			}),
		),
	);
	for (const [index, result] of results.entries()) {
		const agent = AGENTS[index];
		if (result.status === "rejected") {
			debugLog(
				"stdin",
				`${agent.name} context injection failed`,
				result.reason,
			);
		} else {
			debugLog(
				"stdin",
				`${agent.name} context injection status: ${result.value.status}`,
			);
		}
	}
}
