import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { libp2p, type Action } from "../../index.ts";
import { companion } from "../companion.ts";

export const speakTool = createTool({
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
  execute: async ({ context: { message, target } }) => {
    const data: Action = {
      from: companion.metadata.id,
      name: "speak",
      params: { message, target },
    };
    libp2p.services.pubsub.publish(
      "actions",
      new TextEncoder().encode(JSON.stringify(data))
    );
    return {
      content: [{ type: "text", text: "行動が正常に実行されました。" }],
    };
  },
});

export const lookTool = createTool({
  id: "look",
  description: "一点を注視する",
  inputSchema: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  execute: async ({ context: { x, y, z } }) => {
    const data: Action = {
      from: companion.metadata.id,
      name: "look",
      params: { x, y, z },
    };
    libp2p.services.pubsub.publish(
      "actions",
      new TextEncoder().encode(JSON.stringify(data))
    );
    return {
      content: [{ type: "text", text: "行動が正常に実行されました。" }],
    };
  },
});

export const moveTool = createTool({
  id: "move",
  description: "場所を移動する",
  inputSchema: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  execute: async ({ context: { x, y, z } }) => {
    const data: Action = {
      from: companion.metadata.id,
      name: "move",
      params: { x, y, z },
    };
    libp2p.services.pubsub.publish(
      "actions",
      new TextEncoder().encode(JSON.stringify(data))
    );
    return {
      content: [{ type: "text", text: "行動が正常に実行されました。" }],
    };
  },
});

export const gestureTool = createTool({
  id: "gesture",
  description: "体の動きを表現する",
  inputSchema: z.object({
    type: z.enum(["wave", "jump", "dance", "nod", "stretch", "clap"]),
  }),
  execute: async ({ context: { type } }) => {
    const data: Action = {
      from: companion.metadata.id,
      name: "gesture",
      params: { type },
    };
    libp2p.services.pubsub.publish(
      "actions",
      new TextEncoder().encode(JSON.stringify(data))
    );
    return {
      content: [{ type: "text", text: "行動が正常に実行されました。" }],
    };
  },
});
