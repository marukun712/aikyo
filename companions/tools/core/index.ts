import type { Query } from "@aikyo/server";
import { createCompanionAction, createCompanionKnowledge } from "@aikyo/utils";
import { z } from "zod";

export const speakTool = createCompanionAction({
  id: "speak",
  description: "発言する。",
  inputSchema: z.object({
    message: z.string(),
    to: z
      .array(z.string())
      .describe(
        "このメッセージの宛先。必ずコンパニオンのidを指定してください。特定のコンパニオンに個人的に話しかけたいとき以外は、必ず、会話に参加したことのある全員を含むようにしてください。また、積極的にuserに会話を振ってください。",
      ),
    emotion: z.enum(["happy", "sad", "angry", "neutral"]),
  }),
  topic: "messages",
  publish: async ({ input, id, sendQuery }) => {
    const queryId = crypto.randomUUID();
    const query: Query = {
      jsonrpc: "2.0",
      id: queryId,
      method: "query.send",
      params: {
        from: id,
        type: "speak",
        body: { message: input.message, emotion: input.emotion },
      },
    };
    await sendQuery(query);
    return {
      jsonrpc: "2.0",
      method: "message.send",
      params: {
        id: crypto.randomUUID(),
        from: id,
        to: input.to,
        message: input.message,
        metadata: { emotion: input.emotion },
      },
    };
  },
});

export const companionNetworkKnowledge = createCompanionKnowledge({
  id: "companions-network",
  description:
    "同じネットワークに所属しているコンパニオンのリストを取得します。",
  inputSchema: z.object({}),
  outputSchema: z.string(),
  knowledge: async ({ companions }) =>
    Array.from(companions.entries())
      .map((metadata) => JSON.stringify(metadata, null, 2))
      .join("\n"),
});
