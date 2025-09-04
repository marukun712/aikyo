import { Tool } from "@mastra/core";
import { z } from "zod";

export const MetadataSchema = z.object({
  id: z.string(),
  url: z.string(),
  name: z.string(),
  personality: z.string(),
  story: z.string(),
  sample: z.string(),
});
export type Metadata = z.infer<typeof MetadataSchema>;

export const EventSchema = z.object({
  condition: z.string(),
  tool: z.array(z.string()),
});

export const EventCondition = z.object({
  expression: z.string(),
  execute: z.array(
    z.object({
      instruction: z.string(),
      tool: z.instanceof(Tool),
    }),
  ),
});

export const CompanionSchema = z.object({
  metadata: MetadataSchema,
  role: z.string(),
  actions: z.record(z.instanceof(Tool)),
  knowledge: z.record(z.instanceof(Tool)),
  events: z.object({
    params: z.record(z.string(), z.any()),
    conditions: z.array(EventCondition),
  }),
});
export type CompanionCard = z.infer<typeof CompanionSchema>;

export const MessageSchema = z.object({
  metadata: z.record(z.string(), z.any()).optional(), // MetadataにKindも入れちゃお～！
  from: z.string(),
  to: z.string(),
  message: z.string(),
});
export type Message = z.infer<typeof MessageSchema>;

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
