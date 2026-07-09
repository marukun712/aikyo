import * as TID from "@atcute/tid";
import { computeRootHash } from "./core.ts";
import {
	HeartbeatReqSchema,
	type State,
	type Sync,
	SyncReqSchema,
	SyncResSchema,
} from "./schema.ts";
import type { Transport } from "./transport.ts";

const HEARTBEAT_INTERVAL = 5000;
const HEARTBEAT_TIMEOUT = 15000;

export class Node {
	state: State = { want_to_speak: false, importance: 1 };
	msgLog: string[] = [];
}

export type Member = { displayName: string; lastHeartbeat: number };

export function startSync(
	node: Node,
	displayName: string,
	transport: Transport,
): { nodeId: string; members: Map<string, Member> } {
	const nodeId = TID.now();
	const members = new Map<string, Member>([
		[nodeId, { displayName, lastHeartbeat: Date.now() }],
	]);

	function syncState(): Sync {
		return {
			messageRootHash: computeRootHash(node.msgLog),
			latestMessageTid: node.msgLog.at(-1)?.split(".")[0] ?? "",
		};
	}

	transport.send({
		jsonrpc: "2.0",
		method: "heartbeat",
		params: { nodeId, displayName, syncState: syncState() },
	});

	transport.onReceive((raw) => {
		const hb = HeartbeatReqSchema.safeParse(raw);
		if (hb.success) {
			const {
				nodeId: nid,
				displayName: dname,
				syncState: their,
			} = hb.data.params;
			members.set(nid, { displayName: dname, lastHeartbeat: Date.now() });
			const my = syncState();
			if (their.messageRootHash !== my.messageRootHash) {
				transport.send({
					jsonrpc: "2.0",
					method: "sync_request",
					params: { fromTid: my.latestMessageTid },
					id: TID.now(),
				});
			}
			return;
		}

		const syncReq = SyncReqSchema.safeParse(raw);
		if (syncReq.success) {
			const entries = node.msgLog.filter(
				(e) => e.split(".")[0] > syncReq.data.params.fromTid,
			);
			transport.send({
				jsonrpc: "2.0",
				result: { entries },
				id: syncReq.data.id,
			});
			return;
		}

		const syncRes = SyncResSchema.safeParse(raw);
		if (syncRes.success) {
			for (const e of syncRes.data.result.entries) {
				if (!node.msgLog.includes(e)) node.msgLog.push(e);
			}
			node.msgLog.sort();
		}
	});

	setInterval(() => {
		transport.send({
			jsonrpc: "2.0",
			method: "heartbeat",
			params: { nodeId, displayName, syncState: syncState() },
		});
	}, HEARTBEAT_INTERVAL);

	setInterval(() => {
		const now = Date.now();
		for (const [nid, m] of members) {
			if (nid !== nodeId && now - m.lastHeartbeat > HEARTBEAT_TIMEOUT) {
				members.delete(nid);
			}
		}
	}, HEARTBEAT_INTERVAL);

	return { nodeId, members };
}
