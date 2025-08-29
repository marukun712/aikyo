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
    libp2p.services.pubsub.publish(
      "messages",
      new TextEncoder().encode(JSON.stringify(body, null, 2))
    );
    const target = Array.from(companions.entries()).find(
      ([k, v]) => v.id === body.to
    );
    if (!target)
      return {
        content: [
          {
            type: "text",
            text: "Error:宛先に指定したコンパニオンが見つかりません。",
          },
        ],
      };
    const rawUrl = target[1].url;
    const url = new URL(rawUrl);
    const res = await fetch(`${url.href}generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const json = await res.json();
      return {
        content: [
          {
            type: "text",
            text: "Error:メッセージ送信に失敗しました" + json.error,
          },
        ],
      };
    }
    const json = await res.json();
    const parsed = MessageSchema.safeParse(json);
    if (!parsed.success)
      return {
        content: [
          {
            type: "text",
            text: "Error:メッセージのスキーマが不正です。",
          },
        ],
      };
    return {
      content: [{ type: "text", text: parsed.data }],
    };
  },
});
