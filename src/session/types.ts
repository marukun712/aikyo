import type { AgentState, Message } from "../core/types.ts";

// 低レベル: JSON-RPCメッセージの送受信のみ。
// 会話協調ロジックはここに持ち込まない。
export type NetworkMessage = Record<string, unknown>;

export interface Transport {
	send(message: NetworkMessage): void;
	onReceive(handler: (message: NetworkMessage) => void): void;
}

// 同期されたデータストア。MCPがSessionを読んでターンを回す。
// LocalとRemoteで実装が異なるが、MCPからは同じインターフェースに見える。
export interface Session {
	getStates(): Map<string, AgentState>;
	setState(nodeId: string, state: AgentState): void;
	getMessages(): Message[];
	addMessage(message: Message): void;
	getContext(): string;
	setContext(context: string): void;
}
