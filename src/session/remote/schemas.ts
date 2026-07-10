import { z } from "zod";

export const SyncAnnounceSchema = z.object({
	jsonrpc: z.literal("2.0"),
	method: z.literal("sync_announce"),
	params: z.object({
		stateRootHash: z.string(),
		latestStateTid: z.string(),
		messageRootHash: z.string(),
		latestMessageTid: z.string(),
	}),
});

export const SyncRequestSchema = z.object({
	jsonrpc: z.literal("2.0"),
	method: z.literal("sync_request"),
	params: z.object({
		type: z.enum(["state", "message"]),
		fromTid: z.string(),
	}),
	id: z.string(),
});

export const SyncResponseSchema = z.object({
	jsonrpc: z.literal("2.0"),
	result: z.object({ entries: z.array(z.string()) }),
	id: z.string(),
});
