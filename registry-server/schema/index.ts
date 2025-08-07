import { z } from "zod";

export const AiCompanionSchema = z.object({
  metadata: z.object({
    id: z.string().uuid(),
    name: z.string(),
    url: z.string().url(),
    personality: z.string(),
    story: z.string(),
    version: z.string(),
    author: z.string(),
    icon: z.string().url(),
    tags: z.array(z.string()),
  }),
  actions: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      type: z.string(),
      properties: z.record(z.string(), z.any()),
      required: z.array(z.string()),
    })
  ),
  perceptions: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      type: z.string(),
      properties: z.record(z.string(), z.any()),
      required: z.array(z.string()),
    })
  ),
  events: z.array(
    z.object({
      messageType: z.enum(["perception", "action"]),
      request: z.array(z.string()),
      action: z.array(z.string()).optional(),
      response: z.array(z.string()).optional(),
      condition: z.string(),
    })
  ),
});

export type AiCompanion = z.infer<typeof AiCompanionSchema>;
