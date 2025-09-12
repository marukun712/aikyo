import z from "zod";

export const MessageSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.array(z.string()),
  message: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const ResourceSchema = z.object({
  to: z.array(z.string()).describe("List of companion IDs"),
  thread: z.string().describe("Thread ID"),
  resource: z.string().describe("Resource ID"),
});

export const RawMessageSchema = z.union([
  MessageSchema.extend({ kind: z.literal("message") }),
  ResourceSchema.extend({ kind: z.literal("resource") }),
]);
export type RawMessage = z.infer<typeof RawMessageSchema>;

export type MessageHandlers = "message" | "resource";
