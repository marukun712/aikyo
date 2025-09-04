import { createTool } from "@mastra/core/tools";
import { Message, MessageSchema } from "../../schema/index.ts";
import { isLibp2p, Libp2p } from "libp2p";
import { Services } from "@aikyo/utils";
import z from "zod";

export const talkTool = createTool({
  id: "talk",
  inputSchema: z.object({
    to: z
      .string()
      .describe('必ず、送信先コンパニオンの"id"を指定してください。'),
    message: z.string(),
    emotion: z.enum(["neutral", "happy", "sad", "angry"]),
  }),
  description: `他のコンパニオンに話しかけます。`,
  execute: async ({ context, runtimeContext }) => {
    const id = runtimeContext.get("id");
    if (!id || typeof id !== "string") {
      return {
        content: [{ type: "text", text: "Error:コンパニオンのidが不正です。" }],
      };
    }
    const libp2p: Libp2p<Services> = runtimeContext.get("libp2p");
    if (!libp2p || !isLibp2p(libp2p)) {
      return {
        content: [
          { type: "text", text: "Error:Libp2pが初期化されていません。" },
        ],
      };
    }
    const companions = runtimeContext.get("companions");
    if (!(companions instanceof Map)) {
      return {
        content: [
          {
            type: "text",
            text: "Error:Companion listが初期化されていません。",
          },
        ],
      };
    }
    const body: Message = {
      from: id,
      to: context.to,
      message: context.message,
      metadata: { emotion: context.emotion },
    };
    // https://libp2p.github.io/js-libp2p/interfaces/_libp2p_interface.PublishResult.html
    // recipientsは本当に受信したのかどうかわからん！検証したい。
    const publishResult = await libp2p.services.pubsub.publish(
      "messages",
      new TextEncoder().encode(JSON.stringify(body, null, 2))
    );
  },
});
