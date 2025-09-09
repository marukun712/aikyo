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
        "このメッセージの宛先。必ずコンパニオンのidを指定してください。",
      ),
  }),
  topic: "messages",
  publish: ({ message, to }, id) => {
    return {
      id: crypto.randomUUID(),
      from: id,
      to,
      message,
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
  knowledge: async (_params, _id, companions) => {
    return Array.from(companions.entries())
      .map((metadata) => JSON.stringify(metadata, null, 2))
      .join("\n");
  },
});
