import type { Message } from "@libp2p/interface";
import type { LoroDoc } from "loro-crdt";
import type {
  Message as AikyoMessage,
  Metadata,
  QueryResult,
} from "../../../schema/index.js";
import {
  MessageSchema,
  QueryResultSchema,
  StateSchema,
} from "../../../schema/index.js";
import { logger } from "../../logger.js";

export const handlePubSubMessage = async (
  history: AikyoMessage[],
  metadata: Metadata,
  doc: LoroDoc,
  pendingQueries: Map<
    string,
    {
      resolve: (value: QueryResult) => void;
      reject: (reason: string) => void;
    }
  >,
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
        //一時会話履歴にpush
        history.push(parsed.data);
        if (history.length > 5) {
          history.shift();
        }
        if (
          body.params.to.find((to) => {
            return to === metadata.id;
          })
        ) {
          doc.getList("messages").push(body);
        }
        break;
      }
      case "states": {
        const parsed = StateSchema.safeParse(data);
        if (!parsed.success) return;
        const state = parsed.data;
        doc.getList("states").push(state);
        break;
      }
      case "queries": {
        const parsed = QueryResultSchema.safeParse(data);
        if (!parsed.success) return;
        const result = parsed.data;
        const pendingQuery = pendingQueries.get(result.id);
        if (pendingQuery) {
          pendingQueries.delete(result.id);
          pendingQuery.resolve(result);
        }
        break;
      }
    }
  } catch (e) {
    logger.error({ err: e }, "Error handling pubsub message");
  }
};
