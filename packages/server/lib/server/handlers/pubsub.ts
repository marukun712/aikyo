import type { Message } from "@libp2p/interface";
import z from "zod";
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
  try {
    switch (topic) {
      case "messages": {
        const data = JSON.parse(new TextDecoder().decode(message.detail.data));
        const parsed = MessageSchema.safeParse(data);
        if (!parsed.success) return;
        const msg = parsed.data;
        //一時会話履歴にpush
        self.history.push(parsed.data);
        if (self.history.length > 5) {
          self.history.shift();
        }
        const selected = msg.params.to.find((to) => {
          return to === self.card.metadata.id;
        });
        if (selected) {
          await self.onMessage(msg);
        }
        break;
      }
      case "states": {
        const data = JSON.parse(new TextDecoder().decode(message.detail.data));
        const parsed = z.array(StateSchema).safeParse(data);
        if (!parsed.success) return;
        const states = parsed.data;
        await self.agent.generate(states, self.companionList);
        break;
      }
      case "queries": {
        const data = JSON.parse(new TextDecoder().decode(message.detail.data));
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
