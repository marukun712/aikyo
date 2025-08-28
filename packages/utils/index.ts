import { createTool } from "@mastra/core/tools";
import { z, type ZodTypeAny } from "zod";
import { type Action, type Context } from "./schema/index.ts";
import { isLibp2p, type Libp2p } from "libp2p";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { identify } from "@libp2p/identify";

type Services = {
  pubsub: ReturnType<ReturnType<typeof gossipsub>>;
  identify: ReturnType<ReturnType<typeof identify>>;
};

type Output = Action | Context;

interface CompanionActionConfig<T extends z.ZodSchema> {
  id: string;
  description: string;
  inputSchema: T;
  topic: "actions" | "contexts";
  publish: (
    input: z.infer<T>,
    id: string,
    companions: Map<string, string>,
  ) => Promise<Output> | Output;
}

interface CompanionKnowledgeConfig<T extends z.ZodSchema> {
  id: string;
  description: string;
  inputSchema: T;
  knowledge: (
    input: z.infer<T>,
    id: string,
    companions: Map<string, string>,
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
        if (!libp2p || !isLibp2p(libp2p)) {
          throw new Error("Error:libp2pが初期化されていません!");
        }

        const id = runtimeContext.get("id");
        if (!id || typeof id !== "string") {
          throw new Error("Error:コンパニオンのidが不正です!");
        }

        const companions = runtimeContext.get("companions");
        if (!(companions instanceof Map)) {
          throw new Error("Error:companionsの形式が不正です!");
        }

        const data = await publish(context, id, companions);
        const node = libp2p as Libp2p<Services>;
        node.services.pubsub.publish(
          topic,
          new TextEncoder().encode(JSON.stringify(data)),
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
        if (!id || typeof id !== "string") {
          throw new Error("Error:コンパニオンのidが不正です!");
        }

        const companions = runtimeContext.get("companions");
        if (!(companions instanceof Map)) {
          throw new Error("Error:companionsの形式が不正です!");
        }

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
