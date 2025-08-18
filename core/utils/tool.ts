import { createTool } from "@mastra/core/tools";
import { z, type ZodTypeAny } from "zod";

export function createCompanionAction<T extends ZodTypeAny>({
  id,
  description,
  topic,
  inputSchema,
  buildData,
}: {
  id: string;
  description: string;
  topic: string;
  inputSchema: T;
  buildData: (
    input: z.infer<T>
  ) => Record<string, any> | Promise<Record<string, any>>;
}) {
  return createTool({
    id,
    description,
    inputSchema,
    execute: async ({ context, runtimeContext }) => {
      try {
        const libp2p = runtimeContext.get("libp2p");
        if (!libp2p) throw new Error("Error : LibP2Pが初期化されていません!");
        const data = await buildData(context);
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
