import type { Message } from "@libp2p/interface";
import {
  MessageSchema,
  QueryResultSchema,
  StateSchema,
} from "../../../schema/index.js";
import { logger } from "../../logger.js";
import type { CompanionServer } from "../companionServer.js";

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
        //一時時会話履歴にpush
        self.history.push(parsed.data);
        if (self.history.length > 5) {
          self.history.shift();
        }
        if (
          body.params.to.find((to) => {
            return to === self.companion.metadata.id;
          })
        ) {
          await self.handleMessageReceived(body);
        }
        break;
      }
      case "states": {
        const parsed = StateSchema.safeParse(data);
        if (!parsed.success) return;
        const state = parsed.data;
        await self.turnTakingManager.handleStateReceived(state);
        break;
      }
      case "queries": {
        const parsed = QueryResultSchema.safeParse(data);
        if (!parsed.success) return;
        const result = parsed.data;
        const pendingQuery = self.pendingQueries.get(result.id);
        if (pendingQuery) {
          self.pendingQueries.delete(result.id);
          pendingQuery.resolve(result);
        }
        break;
      }
    }
  } catch (e) {
    logger.error({ err: e }, "Error handling pubsub message");
  }
};
