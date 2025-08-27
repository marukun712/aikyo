import { z } from "zod";
import { createCompanionAction, createCompanionKnowledge } from "@aikyo/utils";

export const contextAction = createCompanionAction({
  id: "context",
  description: "同じネットワークのコンパニオンたちに共有した記憶を送信します。",
  inputSchema: z.object({
    text: z
      .string()
      .describe(
        "この文章は、キャラクターとしてではなく、本来のあなたとして、共有したい記憶を簡潔に記述してください。"
      ),
  }),
  topic: "contexts",
  publish: ({ text }) => ({ type: "text", context: text }),
});

export const gestureAction = createCompanionAction({
  id: "gesture",
  description: "体の動きを表現する",
  inputSchema: z.object({
    type: z.enum(["wave", "jump", "dance", "nod", "stretch", "clap"]),
  }),
  topic: "actions",
  publish: ({ type }, id) => ({
    from: id,
    name: "gesture",
    params: { type },
  }),
});

export const companionNetworkKnowledge = createCompanionKnowledge({
  id: "companions-network",
  description:
    "同じネットワークに所属しているコンパニオンのリストを取得します。",
  inputSchema: z.object({}),
  knowledge: async ({}, id, companions) => {
    return Array.from(companions.entries())
      .map((metadata) => JSON.stringify(metadata, null, 2))
      .join("\n");
  },
});
