import { z } from "zod";

export const MessageSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.array(z.string()),
  message: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
});
export type Message = z.infer<typeof MessageSchema>;

export const ActionSchema = z.object({
  metadata: z.record(z.string(), z.any()).optional(),
  from: z.string(),
  name: z.string(),
  params: z.record(z.string(), z.any()),
});
export type Action = z.infer<typeof ActionSchema>;

export const QueryRequest = z.object({
  id: z.string(),
  from: z.string(),
  type: z.string(),
});
export type QueryRequest = z.infer<typeof QueryRequest>;

export const QueryResult = z.object({
  id: z.string(),
  success: z.boolean(),
  body: z.string().optional(),
  error: z.string().optional().describe("エラーメッセージ"),
});
export type QueryResult = z.infer<typeof QueryResult>;
