import { Tool } from "@mastra/core";
import { z } from "zod";

export const MetadataSchema = z.object({
  id: z.string(),
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

export const StateSchema = z.object({
  from: z.string(),
  messageId: z.string().describe("このstateが対応する元のメッセージのID"),
  state: z
    .enum(["speak", "listen"])
    .describe("次に発言をしたいか、聞く姿勢に入りたいか"),
  importance: z
    .number()
    .min(0)
    .max(10)
    .describe("会話の文脈におけるあなたが次にしたい発言の重要度"),
  selected: z
    .boolean()
    .describe("前回の発言者の発言で、あなたに発言を求められているかどうか"),
  closing: z
    .enum(["none", "pre-closing", "closing", "terminal"])
    .default("none")
    .describe("会話の収束段階:なし/事前クロージング/クロージング/終端"),
});
export type State = z.infer<typeof StateSchema>;

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

export const MemorySchema = z.object({
  messages: z.array(
    z.object({
      from: z.string().describe("メッセージを送信したコンパニオンのid"),
      content: z.string().describe("メッセージ内容を要約したもの"),
    }),
  ),
});
