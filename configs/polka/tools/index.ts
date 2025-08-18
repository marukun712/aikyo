import { z } from "zod";
import { companion } from "../companion.ts";
import { createCompanionAction } from "@aicompanion/core";

export const speakAction = createCompanionAction({
  id: "speak",
  description:
    "話す。特定のコンパニオンに向けて話したい場合はtargetを指定できます。",
  inputSchema: z.object({
    message: z.string(),
    target: z
      .string()
      .optional()
      .describe("特定のコンパニオンのIDを指定(任意)"),
  }),
  topic: "messages",
  publish: ({ message, target }) => ({
    from: companion.metadata.id,
    message,
    target,
  }),
});

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
  publish: ({ type }) => ({
    from: companion.metadata.id,
    name: "gesture",
    params: { type },
  }),
});
