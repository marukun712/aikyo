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
