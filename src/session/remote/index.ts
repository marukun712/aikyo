import * as TID from "@atcute/tid";
import type { AgentState, Message } from "../../core/types.ts";
import type { Session, Transport } from "../types.ts";
import {
	SyncAnnounceSchema,
	SyncRequestSchema,
	SyncResponseSchema,
} from "./schemas.ts";
import {
	computeRootHash,
	messageEntryFromMessage,
	parseMessageEntry,
	parseStateEntry,
	stateEntryFromArgs,
} from "./sync.ts";

// AIの生成に数秒かかるため、1秒のsyncで十分追従できる。
const SYNC_INTERVAL = 1000;

// P2Pセッション: state logとmessage logをノード間でdiff syncする。
// ターンテイキングはMCP側が行うためセッションはデータストアに徹する。
export class RemoteSession implements Session {
	private stateLog: string[] = [];
	private messageLog: string[] = [];
	private context = "";
	// sync_requestのidとログ種別を紐づけ、レスポンスを正しいログに適用するため。
	private pendingRequests = new Map<string, "state" | "message">();

	constructor(private transport: Transport) {
		transport.onReceive((msg) => this.handleReceive(msg));
	}

	start(): void {
		this.announce();
		setInterval(() => this.announce(), SYNC_INTERVAL);
	}

	private announce(): void {
		this.transport.send({
			jsonrpc: "2.0",
			method: "sync_announce",
			params: {
				stateRootHash: computeRootHash(this.stateLog),
				latestStateTid: this.stateLog.at(-1)?.split(".")[0] ?? "",
				messageRootHash: computeRootHash(this.messageLog),
				latestMessageTid: this.messageLog.at(-1)?.split(".")[0] ?? "",
			},
		});
	}

	private addToLog(log: string[], entry: string): void {
		if (log.includes(entry)) return;
		log.push(entry);
		// TIDはエントリの先頭にあるため、ソートでTID順になる。
		log.sort();
	}

	private requestSync(type: "state" | "message", fromTid: string): void {
		const id = TID.now();
		this.pendingRequests.set(id, type);
		this.transport.send({
			jsonrpc: "2.0",
			method: "sync_request",
			params: { type, fromTid },
			id,
		});
	}

	private handleReceive(raw: unknown): void {
		const announce = SyncAnnounceSchema.safeParse(raw);
		if (announce.success) {
			const p = announce.data.params;
			if (p.stateRootHash !== computeRootHash(this.stateLog)) {
				this.requestSync("state", this.stateLog.at(-1)?.split(".")[0] ?? "");
			}
			if (p.messageRootHash !== computeRootHash(this.messageLog)) {
				this.requestSync(
					"message",
					this.messageLog.at(-1)?.split(".")[0] ?? "",
				);
			}
			return;
		}

		const syncReq = SyncRequestSchema.safeParse(raw);
		if (syncReq.success) {
			const { type, fromTid } = syncReq.data.params;
			const log = type === "state" ? this.stateLog : this.messageLog;
			const entries = log.filter((e) => e.split(".")[0] > fromTid);
			this.transport.send({
				jsonrpc: "2.0",
				result: { entries },
				id: syncReq.data.id,
			});
			return;
		}

		const syncRes = SyncResponseSchema.safeParse(raw);
		if (syncRes.success) {
			const type = this.pendingRequests.get(syncRes.data.id);
			if (!type) return;
			this.pendingRequests.delete(syncRes.data.id);
			const log = type === "state" ? this.stateLog : this.messageLog;
			for (const entry of syncRes.data.result.entries) {
				this.addToLog(log, entry);
			}
		}
	}

	getStates(): Map<string, AgentState> {
		// nodeIdごとに最新TIDのエントリだけを残す。
		const latest = new Map<string, { tid: string; state: AgentState }>();
		for (const entry of this.stateLog) {
			const { tid, nodeId, state } = parseStateEntry(entry);
			const current = latest.get(nodeId);
			if (!current || tid > current.tid) {
				latest.set(nodeId, { tid, state });
			}
		}
		const result = new Map<string, AgentState>();
		for (const [nodeId, { state }] of latest) {
			result.set(nodeId, state);
		}
		return result;
	}

	setState(nodeId: string, state: AgentState): void {
		this.addToLog(this.stateLog, stateEntryFromArgs(TID.now(), nodeId, state));
		// 状態更新を即座にpeerへ伝播する。
		this.announce();
	}

	getMessages(): Message[] {
		return this.messageLog.map(parseMessageEntry);
	}

	addMessage(message: Message): void {
		this.addToLog(this.messageLog, messageEntryFromMessage(message));
		// メッセージ追加を即座にpeerへ伝播する。
		this.announce();
	}

	getContext(): string {
		return this.context;
	}

	setContext(context: string): void {
		this.context = context;
	}
}
