import { z } from "zod";

export const AiCompanionSchema = z.object({
  metadata: z.object({
    id: z.string().uuid(),
    name: z.string(),
    personality: z.string(),
    story: z.string(),
    sample: z.string(),
    version: z.string(),
    author: z.string(),
    icon: z.string().url(),
    tags: z.array(z.string()),
  }),
});

export type AiCompanion = z.infer<typeof AiCompanionSchema>;
