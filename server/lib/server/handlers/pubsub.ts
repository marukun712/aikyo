import type { Message } from "@libp2p/interface";
import { MessageSchema, StateSchema } from "../../../schema/index.ts";
import type { CompanionServer } from "../companionServer.ts";

export const handlePubSubMessage = async (
  self: CompanionServer,
  message: CustomEvent<Message>,
) => {
  const topic = message.detail.topic;
  const data = JSON.parse(new TextDecoder().decode(message.detail.data));
  try {
    switch (topic) {
      case "messages": {
        const parsed = MessageSchema.safeParse(data);
        if (!parsed.success) return;
        const body = parsed.data;
        if (
          body.to.find((to) => {
            return to === self.companion.metadata.id;
          })
        ) {
          console.log("message received.");
          console.log(parsed);
          await self.handleMessageReceived(body);
        }
        break;
      }
      case "states": {
        const parsed = StateSchema.safeParse(data);
        if (!parsed.success) return;
        console.log("state received.");
        console.log(parsed);
        const state = parsed.data;
        await self.turnTakingManager.handleStateReceived(state);
      }
    }
  } catch (e) {
    console.error(e);
  }
};
