import { createTool } from "@mastra/core/tools";
import { z, type ZodTypeAny } from "zod";
import { type Action, type Context, type Message } from "../schema/index.ts";

export function createCompanionAction<T extends ZodTypeAny>({
  id,
  description,
  inputSchema,
  topic,
  publish,
}: {
  id: string;
  description: string;
  inputSchema: T;
  topic: string;
  publish: (
    input: z.infer<T>
  ) => Action | Context | Message | Promise<Action | Context | Message>;
}) {
  return createTool({
    id,
    description,
    inputSchema,
    execute: async ({ context, runtimeContext }) => {
      try {
        const libp2p = runtimeContext.get("libp2p");
        if (!libp2p) throw new Error("Error : LibP2Pが初期化されていません!");
        const data = await publish(context);
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
}: {
  id: string;
  description: string;
  inputSchema: T;
  knowledge: (input: z.infer<T>) => string | Promise<string>;
}) {
  return createTool({
    id,
    description,
    inputSchema,
    execute: async ({ context }) => {
      try {
        const data = await knowledge(context);
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
