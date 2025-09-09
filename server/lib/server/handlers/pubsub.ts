import type { Message } from "@libp2p/interface";
import {
  MessageSchema,
  MetadataSchema,
  StateSchema,
} from "../../../schema/index.ts";
import type { CompanionServer } from "../companionServer.ts";

export const handlePubSubMessage = async (
  self: CompanionServer,
  message: CustomEvent<Message>,
) => {
  if (message.detail.type === "unsigned") return;
  const topic = message.detail.topic;
  const peerId = message.detail.from.toString();
  const data = JSON.parse(new TextDecoder().decode(message.detail.data));

  try {
    switch (topic) {
      case "metadata": {
        const parsed = MetadataSchema.safeParse(data);
        if (
          !parsed.success ||
          peerId === self.libp2p.peerId.toString() ||
          self.companionList.has(peerId)
        )
          return;
        console.log("metadata received.");
        console.log(parsed);
        self.companionList.set(peerId, parsed.data);
        break;
      }
      case "messages": {
        const parsed = MessageSchema.safeParse(data);
        console.log("message received.");
        console.log(parsed);
        if (!parsed.success) return;
        const body = parsed.data;
        await self.handleMessageReceived(body);
        break;
      }
      case "states": {
        const parsed = StateSchema.safeParse(data);
        console.log("state received.");
        console.log(parsed);
        if (!parsed.success) return;
        const state = parsed.data;
        await self.turnTakingManager.handleStateReceived(state);
      }
    }
  } catch (e) {
    console.error(e);
  }
};
