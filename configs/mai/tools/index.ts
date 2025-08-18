import { createTool, type Tool } from "@mastra/core/tools";
import { z, type ZodTypeAny } from "zod";
import { companion } from "../companion.ts";

async function publishToNetwork<T>(
  topic: string,
  data: T,
  successMessage: string,
  errorMessage: string
) {
  try {
    libp2p.services.pubsub.publish(
      topic,
      new TextEncoder().encode(JSON.stringify(data))
    );
    return { content: [{ type: "text", text: successMessage }] };
  } catch (e) {
    console.error(e);
    return { content: [{ type: "text", text: errorMessage }] };
  }
}

function createPubsubTool<T extends ZodTypeAny>({
  id,
  description,
  topic,
  inputSchema,
  buildData,
  successMessage,
  errorMessage,
}: {
  id: string;
  description: string;
  topic: string;
  inputSchema: T;
  buildData: (input: z.infer<T>) => any;
  successMessage?: string;
  errorMessage?: string;
}): Tool<z.infer<T>> {
  return createTool({
    id,
    description,
    inputSchema,
    execute: async ({ context }) => {
      const data = buildData(context.input);
      return publishToNetwork(
        topic,
        data,
        successMessage ?? `${id} が正常に送信されました。`,
        errorMessage ?? `${id} の送信中にエラーが発生しました。`
      );
    },
  });
}

export const speakTool = createPubsubTool({
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

export const contextTool = createPubsubTool({
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

export const gestureTool = createPubsubTool({
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
