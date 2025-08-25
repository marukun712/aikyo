import { createTool } from "@mastra/core/tools";
import { z, type ZodTypeAny } from "zod";
import { type Action, type Context, type Message } from "../schema/index.ts";

type Output = Action | Context | Message;

interface CompanionActionConfig<T extends z.ZodSchema> {
  id: string;
  description: string;
  inputSchema: T;
  topic: "messages" | "actions" | "contexts";
  publish: (
    input: z.infer<T>,
    id: string,
    companions: Map<string, string>
  ) => Promise<Output> | Output;
}

interface CompanionKnowledgeConfig<T extends z.ZodSchema> {
  id: string;
  description: string;
  inputSchema: T;
  knowledge: (
    input: z.infer<T>,
    id: string,
    companions: Map<string, string>
  ) => Promise<string> | string;
}

export function createCompanionAction<T extends ZodTypeAny>({
  id,
  description,
  inputSchema,
  topic,
  publish,
}: CompanionActionConfig<T>) {
  return createTool({
    id,
    description,
    inputSchema,
    execute: async ({ context, runtimeContext }) => {
      try {
        const libp2p = runtimeContext.get("libp2p");
        if (!libp2p) throw new Error("Error:libp2pが初期化されていません!");
        const id = runtimeContext.get("id");
        if (!id) throw new Error("Error:コンパニオンのidが不正です!");
        const companions = runtimeContext.get("companions");
        const data = await publish(context, id, companions);
        libp2p.services.pubsub.publish(
          topic,
          new TextEncoder().encode(JSON.stringify(data))
        );
        return {
          content: [{ type: "text", text: "ツールが正常に実行されました。" }],
        };
      } catch (e) {
        console.error(e);
        return {
          content: [{ type: "text", text: "ツールの実行に失敗しました" + e }],
        };
      }
    },
  });
}

export function createCompanionKnowledge<T extends ZodTypeAny>({
  id,
  description,
  inputSchema,
  knowledge,
}: CompanionKnowledgeConfig<T>) {
  return createTool({
    id,
    description,
    inputSchema,
    execute: async ({ context, runtimeContext }) => {
      try {
        const id = runtimeContext.get("id");
        if (!id) throw new Error("Error:コンパニオンのidが不正です!");
        const companions = runtimeContext.get("companions");
        const data = await knowledge(context, id, companions);
        return {
          content: [{ type: "text", text: data }],
        };
      } catch (e) {
        console.error(e);
        return {
          content: [{ type: "text", text: "知識の取得に失敗しました。" + e }],
        };
      }
    },
  });
}
