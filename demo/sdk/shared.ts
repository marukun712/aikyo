import { anthropic } from "@ai-sdk/anthropic";
import { createMCPClient } from "@ai-sdk/mcp";
import { isStepCount, ToolLoopAgent } from "ai";
import { startHttp } from "../../src/mcp.ts";
import type { Session } from "../../src/session/types.ts";

const verbose = Deno.args.includes("--verbose");

export async function runAgent(
	nodeId: string,
	displayName: string,
	session: Session,
	port: number,
): Promise<void> {
	startHttp(nodeId, displayName, session, port);

	const mcpClient = await createMCPClient({
		transport: { type: "http", url: `http://localhost:${port}/mcp` },
	});

	const tools = await mcpClient.tools();

	const guideResult = await mcpClient.readResource({ uri: "aikyo://guide" });
	const guide = guideResult.contents[0].text as string;
	const prompt = `あなたは、${displayName} (ID:${nodeId}) です。\n ${guide}`;

	const agent = new ToolLoopAgent({
		model: anthropic("claude-haiku-4-5"),
		instructions: prompt,
		tools,
		stopWhen: isStepCount(5),
	});

	while (true) {
		const historyResult = await mcpClient.readResource({
			uri: "aikyo://history",
		});
		const history = historyResult.contents[0].text as string;

		try {
			await agent.generate({
				prompt: history,
				onStepStart: verbose
					? ({ stepNumber }) => {
							console.log(`[${displayName}] step: ${stepNumber}`);
						}
					: undefined,
				onToolExecutionStart: verbose
					? ({ toolCall }) => {
							console.log(
								`[${displayName}] tool: ${toolCall.toolName}`,
								toolCall.input,
							);
						}
					: undefined,
				onToolExecutionEnd: verbose
					? ({ toolCall, toolOutput }) => {
							console.log(
								`[${displayName}] tool result: ${toolCall.toolName}`,
								toolOutput,
							);
						}
					: undefined,
			});
		} catch (e) {
			console.error(`[${displayName}] error:`, e);
		}

		await new Promise((resolve) => setTimeout(resolve, 300));
	}
}
