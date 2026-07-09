import * as TID from "@atcute/tid";
import { electLeader } from "./core.ts";
import {
	AssignSchema,
	SpeakSchema,
	StateReqSchema,
	StateResSchema,
} from "./schema.ts";
import type { Member, Node } from "./sync.ts";
import type { Transport } from "./transport.ts";

const STATE_REQUEST_TIMEOUT = 5000;
const SPEAKER_ASSIGN_TIMEOUT = 10000;

export type TurnState = {
	isMyTurn: boolean;
	currentSpeaker: string | null;
};

export function startTurn(
	nodeId: string,
	node: Node,
	members: Map<string, Member>,
	transport: Transport,
): TurnState {
	const turn: TurnState = { isMyTurn: false, currentSpeaker: null };

	let speakerAssignTimer: ReturnType<typeof setTimeout> | null = null;
	const pendingStates = new Map<
		string,
		{ nodeId: string; want_to_speak: boolean; importance: number }
	>();

	function runAsLeader(speakTid: string, nextId?: string) {
		if (nextId) {
			transport.send({
				jsonrpc: "2.0",
				method: "speaker_assign",
				params: { nodeId: nextId },
			});
			return;
		}
		pendingStates.clear();
		pendingStates.set(nodeId, { nodeId, ...node.state });
		transport.send({
			jsonrpc: "2.0",
			method: "state_request",
			params: { tid: speakTid },
			id: TID.now(),
		});
		setTimeout(() => {
			const want = [...pendingStates.values()].filter((r) => r.want_to_speak);
			const next =
				want.length === 0
					? (turn.currentSpeaker ?? nodeId)
					: want.reduce((a, b) => (a.importance >= b.importance ? a : b))
							.nodeId;
			transport.send({
				jsonrpc: "2.0",
				method: "speaker_assign",
				params: { nodeId: next },
			});
		}, STATE_REQUEST_TIMEOUT);
	}

	function runTurnTransition(speakTid: string, nextId?: string) {
		const active = [...members.keys()].sort();
		const leader = electLeader(speakTid, active);
		if (leader !== nodeId) {
			speakerAssignTimer = setTimeout(() => {
				members.delete(leader);
				const newLeader = electLeader(speakTid, [...members.keys()].sort());
				if (newLeader === nodeId) runAsLeader(speakTid, nextId);
			}, SPEAKER_ASSIGN_TIMEOUT);
			return;
		}
		runAsLeader(speakTid, nextId);
	}

	transport.onReceive((raw) => {
		const speak = SpeakSchema.safeParse(raw);
		if (speak.success) {
			const { tid, nodeId: nid, text, nextId } = speak.data.params;
			const dname = members.get(nid)?.displayName ?? nid;
			const entry = nextId
				? `${tid}.${dname}.${text}.${nextId}`
				: `${tid}.${dname}.${text}`;
			if (!node.msgLog.includes(entry)) node.msgLog.push(entry);
			turn.currentSpeaker = nid;
			turn.isMyTurn = false;
			if (speakerAssignTimer) clearTimeout(speakerAssignTimer);
			runTurnTransition(tid, nextId);
			return;
		}

		const assign = AssignSchema.safeParse(raw);
		if (assign.success) {
			if (speakerAssignTimer) {
				clearTimeout(speakerAssignTimer);
				speakerAssignTimer = null;
			}
			turn.currentSpeaker = assign.data.params.nodeId;
			turn.isMyTurn = assign.data.params.nodeId === nodeId;
			return;
		}

		const stateReq = StateReqSchema.safeParse(raw);
		if (stateReq.success) {
			transport.send({
				jsonrpc: "2.0",
				result: { ...node.state, nodeId },
				id: stateReq.data.id,
			});
			return;
		}

		const stateRes = StateResSchema.safeParse(raw);
		if (stateRes.success) {
			pendingStates.set(stateRes.data.result.nodeId, stateRes.data.result);
		}
	});

	return turn;
}
