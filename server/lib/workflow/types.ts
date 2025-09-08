import type { CompanionAgent } from "../agents/index.ts";

export type AgentType = InstanceType<typeof CompanionAgent>["agent"];
