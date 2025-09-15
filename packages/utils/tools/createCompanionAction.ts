import { createTool } from "@mastra/core/tools";
import { isLibp2p, type Libp2p } from "libp2p";
import type { ZodTypeAny, z } from "zod";
import type { Services } from "../lib/services.ts";
import type { Action, Message } from "../schema/index.ts";

type Output = Action | Message;

export interface CompanionActionConfig<T extends z.ZodSchema> {
  id: string;
  description: string;
  inputSchema: T;
  topic: "actions" | "messages";
  publish: (props: {
    input: z.infer<T>;

    id: string;
    companions: Map<string, string>;
    libp2p: Libp2p<Services>;
  }) => Promise<Output> | Output;
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
        const libp2p: Libp2p<Services> = runtimeContext.get("libp2p");
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
        const data = await publish({ input: context, id, companions, libp2p });
        libp2p.services.pubsub.publish(
          topic,
          new TextEncoder().encode(JSON.stringify(data)),
        );
        return {
          content: [{ type: "text", text: "ツールが正常に実行されました。" }],
        };
      } catch (e) {
        console.error(e);
        return {
          content: [{ type: "text", text: `ツールの実行に失敗しました${e}` }],
        };
      }
    },
  });
}
