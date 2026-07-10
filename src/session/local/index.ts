import type { AgentState, Message } from "../../core/types.ts";
import type { Session } from "../types.ts";

// 全状態をプロセスのメモリ上に置く。Transportは不要。
export class LocalSession implements Session {
	private states = new Map<string, AgentState>();
	private messages: Message[] = [];
	private context = "";

	getStates(): Map<string, AgentState> {
		return new Map(this.states);
	}

	setState(nodeId: string, state: AgentState): void {
		this.states.set(nodeId, state);
	}

	getMessages(): Message[] {
		return this.messages;
	}

	addMessage(message: Message): void {
		this.messages.push(message);
	}

	getContext(): string {
		return this.context;
	}

	setContext(context: string): void {
		this.context = context;
	}
}
