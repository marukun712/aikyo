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
        "このメッセージの宛先。必ずコンパニオンのidを指定してください。特定のコンパニオンに個人的に話しかけたいとき以外は、必ず、会話に参加したことのある全員を含むようにしてください。",
      ),
  }),
  topic: "messages",
  publish: ({ input, id }) => {
    return {
      id: crypto.randomUUID(),
      from: id,
      to: input.to,
      message: input.message,
    };
  },
});

export const gestureAction = createCompanionAction({
  id: "gesture",
  description: "体の動きを表現する",
  inputSchema: z.object({
    type: z.enum(["wave", "jump", "dance", "nod", "stretch", "clap"]),
  }),
  topic: "actions",
  publish: ({ input, id }) => ({
    from: id,
    name: "gesture",
    params: { input },
  }),
});

export const companionNetworkKnowledge = createCompanionKnowledge({
  id: "companions-network",
  description:
    "同じネットワークに所属しているコンパニオンのリストを取得します。",
  inputSchema: z.object({}),
  knowledge: async ({ companions }) => [
    {
      type: "text",
      text: Array.from(companions.entries())
        .map((metadata) => JSON.stringify(metadata, null, 2))
        .join("\n"),
    },
  ],
});
