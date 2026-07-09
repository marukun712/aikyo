import { z } from "zod";

export const StateSchema = z.object({
	want_to_speak: z.boolean(),
	importance: z.number().int().min(1).max(10),
});
export type State = z.infer<typeof StateSchema>;

export const SyncSchema = z.object({
	messageRootHash: z.string(),
	latestMessageTid: z.string(),
});
export type Sync = z.infer<typeof SyncSchema>;

export const HeartbeatReqSchema = z.object({
	jsonrpc: z.literal("2.0"),
	method: z.literal("heartbeat"),
	params: z.object({
		nodeId: z.string(),
		displayName: z.string(),
		syncState: SyncSchema,
	}),
});

export const SpeakSchema = z.object({
	jsonrpc: z.literal("2.0"),
	method: z.literal("speak"),
	params: z.object({
		tid: z.string(),
		nodeId: z.string(),
		text: z.string(),
		nextId: z.string().optional(),
	}),
});

export const AssignSchema = z.object({
	jsonrpc: z.literal("2.0"),
	method: z.literal("speaker_assign"),
	params: z.object({ nodeId: z.string() }),
});

export const StateReqSchema = z.object({
	jsonrpc: z.literal("2.0"),
	method: z.literal("state_request"),
	params: z.object({ tid: z.string() }),
	id: z.string(),
});

export const StateResSchema = z.object({
	jsonrpc: z.literal("2.0"),
	result: StateSchema.extend({ nodeId: z.string() }),
	id: z.string(),
});

export const SyncReqSchema = z.object({
	jsonrpc: z.literal("2.0"),
	method: z.literal("sync_request"),
	params: z.object({ fromTid: z.string() }),
	id: z.string(),
});

export const SyncResSchema = z.object({
	jsonrpc: z.literal("2.0"),
	result: z.object({ entries: z.array(z.string()) }),
	id: z.string(),
});
