import { z } from "zod";

export const StateSchema = z.object({
	want_to_speak: z.boolean(),
	importance: z.number().int().min(1).max(10),
});
export type AgentState = z.infer<typeof StateSchema>;

export type Message = {
	tid: string;
	nodeId: string;
	displayName: string;
	text: string;
	nextId?: string;
};
