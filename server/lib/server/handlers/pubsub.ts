import { MessageSchema, MetadataSchema } from "../../../schema/index.ts";
import type { CompanionServer } from "../companionServer.ts";

export const handlePubSubMessage = async (
  self: CompanionServer,
  message: CustomEvent,
) => {
  const topic = message.detail.topic;
  const fromPeerId = message.detail.from.toString();

  console.log(`Received message on topic ${topic} from ${fromPeerId}`);

  const data = JSON.parse(new TextDecoder().decode(message.detail.data));
  console.log(data);

  try {
    switch (topic) {
      case "metadata": {
        const parsed = MetadataSchema.safeParse(data);
        if (!parsed.success) return;
        if (fromPeerId === self.libp2p.peerId.toString()) return;
        if (self.companionList.has(fromPeerId)) return;
        self.companionList.set(fromPeerId, parsed.data);
        console.log(`Added peer ${fromPeerId} with metadata:`, parsed.data);
        break;
      }
      case "messages": {
        const parsed = MessageSchema.safeParse(data);
        console.log("=> Message Received:", parsed);
        if (!parsed.success) return;
        if (parsed.data.from === self.companion.metadata.id) return;
        if (parsed.data.to !== self.companion.metadata.id) return;
        await self.companionAgent.generateMessage(parsed.data);
        break;
      }
    }
  } catch (e) {
    console.error(e);
  }
};
