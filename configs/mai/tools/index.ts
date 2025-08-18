import { z } from "zod";
import { companion } from "../companion.ts";
import { createCompanionAction } from "@aicompanion/core";

export const speakTool = createCompanionAction({
  id: "speak",
  description:
    "話す。特定のコンパニオンに向けて話したい場合はtargetを指定できます。",
  topic: "messages",
  inputSchema: z.object({
    message: z.string(),
    target: z
      .string()
      .optional()
      .describe("特定のコンパニオンのIDを指定(任意)"),
  }),
  buildData: ({ message, target }) => ({
    from: companion.metadata.id,
    message,
    target,
  }),
});

export const contextTool = createCompanionAction({
  id: "context",
  description: "同じネットワークのコンパニオンたちに共有した記憶を送信します。",
  topic: "contexts",
  inputSchema: z.object({
    text: z
      .string()
      .describe(
        "この文章は、キャラクターとしてではなく、本来のあなたとして、共有したい記憶を簡潔に記述してください。"
      ),
  }),
  buildData: ({ text }) => ({ type: "text", context: text }),
});

export const gestureTool = createCompanionAction({
  id: "gesture",
  description: "体の動きを表現する",
  topic: "actions",
  inputSchema: z.object({
    type: z.enum(["wave", "jump", "dance", "nod", "stretch", "clap"]),
  }),
  buildData: ({ type }) => ({
    from: companion.metadata.id,
    name: "gesture",
    params: { type },
  }),
});
