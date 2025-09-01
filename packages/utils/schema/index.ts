import { z } from "zod";

export const ActionSchema = z.object({
  metadata: z.record(z.string(), z.any()).optional(),
  from: z.string(),
  name: z.string(),
  params: z.record(z.string(), z.any()),
});
export type Action = z.infer<typeof ActionSchema>;

export const ContextSchema = z.object({
  context: z.string(),
});
export type Context = z.infer<typeof ContextSchema>;
