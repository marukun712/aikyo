import { createHash } from "node:crypto";
import type { AgentState, Message } from "../../core/types.ts";

// エントリをソートしてからハッシュを計算することで、
// 受信順序が異なっても同じエントリセットなら同じハッシュになる。
export function computeRootHash(entries: string[]): string {
	return createHash("sha256").update(entries.join("\n")).digest("hex");
}

// フォーマット: {tid}.{nodeId}.{want_to_speak}.{importance}
export function stateEntryFromArgs(
	tid: string,
	nodeId: string,
	state: AgentState,
): string {
	return `${tid}.${nodeId}.${state.want_to_speak}.${state.importance}`;
}

export function parseStateEntry(entry: string): {
	tid: string;
	nodeId: string;
	state: AgentState;
} {
	const parts = entry.split(".");
	return {
		tid: parts[0],
		nodeId: parts[1],
		state: {
			want_to_speak: parts[2] === "true",
			importance: Number(parts[3]),
		},
	};
}

// フォーマット: {tid}.{nodeId}.{nextId|""}.{displayName}.{text}
// nextIdを固定位置(index 2)に置くことでtextとの曖昧さをなくす。
export function messageEntryFromMessage(m: Message): string {
	return `${m.tid}.${m.nodeId}.${m.nextId ?? ""}.${m.displayName}.${m.text}`;
}

export function parseMessageEntry(entry: string): Message {
	const parts = entry.split(".");
	const nextId = parts[2] || undefined;
	return {
		tid: parts[0],
		nodeId: parts[1],
		nextId,
		displayName: parts[3],
		text: parts.slice(4).join("."),
	};
}
