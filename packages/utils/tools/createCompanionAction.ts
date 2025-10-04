import {
  type Action,
  CompanionAgent,
  type Message,
  type Query,
  type QueryResult,
  type Services,
} from "@aikyo/server";
import { createTool } from "@mastra/core/tools";
import { isLibp2p, type Libp2p } from "libp2p";
import { type ZodTypeAny, z } from "zod";

type Output = Action | Message;

export const sendQuery =
  (
    libp2p: Libp2p<Services>,
    pendingQueries: Map<
      string,
      {
        resolve: (value: QueryResult) => void;
        reject: (reason: string) => void;
      }
    >,
  ) =>
  async (query: Query, timeout?: number) => {
    const resultPromise = new Promise<QueryResult>((resolve, reject) => {
      setTimeout(
        () => {
          pendingQueries.delete(query.id);
          reject(new Error(`Error:クエリがタイムアウトしました。`));
        },
        timeout ? timeout : 30000,
      );
      pendingQueries.set(query.id, {
        resolve,
        reject,
      });
    });
    libp2p.services.pubsub.publish(
      "queries",
      new TextEncoder().encode(JSON.stringify(query)),
    );
    return resultPromise;
  };

export interface CompanionActionConfig<T extends z.ZodSchema> {
  id: string;
  description: string;
  inputSchema: T;
  topic: "actions" | "messages";
  publish: (props: {
    input: z.infer<T>;
    id: string;
    companions: Map<string, string>;
    sendQuery: (query: Query) => Promise<QueryResult>;
    companionAgent: CompanionAgent;
  }) => Promise<Output> | Output;
}

export function createCompanionAction<T extends ZodTypeAny>({
  id,
  description,
  inputSchema,
  topic,
  publish,
}: CompanionActionConfig<T>) {
  return createTool({
    id,
    description,
    inputSchema,
    outputSchema: z.string(),
    execute: async ({ context, runtimeContext }) => {
      try {
        const libp2p: Libp2p<Services> = runtimeContext.get("libp2p");
        if (!libp2p || !isLibp2p(libp2p)) {
          throw new Error("Error: libp2pが初期化されていません!");
        }
        const id = runtimeContext.get("id");
        if (!id || typeof id !== "string") {
          throw new Error("Error: runtimeContextのコンパニオンのidが不正です!");
        }
        const companions = runtimeContext.get("companions");
        if (!(companions instanceof Map)) {
          throw new Error("Error: runtimeContextのcompanionsの形式が不正です!");
        }
        const pendingQueries = runtimeContext.get("pendingQueries");
        if (!(pendingQueries instanceof Map)) {
          throw new Error(
            "Error: runtimeContextのpendingQueriesの形式が不正です!",
          );
        }
        const agent = runtimeContext.get("agent");
        if (!(agent instanceof CompanionAgent)) {
          throw new Error("Error: runtimeContextのAgentの形式が不正です");
        }
        const data = await publish({
          input: context,
          id,
          companions,
          sendQuery: sendQuery(libp2p, pendingQueries),
          companionAgent: agent,
        });
        libp2p.services.pubsub.publish(
          topic,
          new TextEncoder().encode(JSON.stringify(data)),
        );
        return "ツールが正常に実行されました。";
      } catch (e) {
        console.error(e);
        return `ツールの実行に失敗しました${e}`;
      }
    },
  });
}
