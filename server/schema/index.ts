import { z } from "zod";

const MetadataSchema = z.object({
  author: z.string(),
  thumbnail: z.string(),
  created: z.string().datetime(),
  updated: z.string().datetime(),
  tags: z.array(z.string()),
});

const ActionSchema = z.object({
  title: z.string(),
  description: z.string(),
  type: z.literal("object"),
  properties: z.record(z.any()),
  required: z.array(z.string()),
});

const PerceptionSchema = z.object({
  title: z.string(),
  description: z.string(),
  type: z.literal("object"),
  properties: z.record(z.any()),
  required: z.array(z.string()),
});

const EventSchema = z.object({
  perception: z.string(),
  action: z.array(z.string()),
  condition: z.string(),
});

export const AICompanionSchema = z.object({
  name: z.string(),
  personality: z.string().optional(),
  story: z.string().optional(),
  version: z.string().optional(),
  metadata: MetadataSchema.optional(),
  actions: z.array(ActionSchema),
  perceptions: z.array(PerceptionSchema),
  events: z.array(EventSchema),
});

export const PerceptionSendSchema = z.object({
  jsonrpc: z.literal("2.0"),
  method: z.literal("perception.send"),
  params: z.object({
    title: z.string(),
    format: z.string(),
    body: z.string(),
  }),
  id: z.union([z.string(), z.number()]).optional(),
});

export const AgentInitSchema = z.object({
  jsonrpc: z.literal("2.0"),
  method: z.literal("agent.init"),
  id: z.union([z.string(), z.number()]).optional(),
});

export const SubscribeRequestSchema = z.object({
  jsonrpc: z.literal("2.0"),
  method: z.literal("subscribe.request"),
  params: z.object({
    sessionId: z.string(),
  }),
  id: z.union([z.string(), z.number()]).optional(),
});
