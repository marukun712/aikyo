import { CompanionAgent, type Query, type QueryResult } from "@aikyo/server";
import { createTool } from "@mastra/core/tools";
import { isLibp2p, type Libp2p } from "libp2p";
import type { ZodTypeAny, z } from "zod";
import type { Services } from "../lib/services";
import { sendQuery } from "./createCompanionAction";

export interface CompanionKnowledgeConfig<
  T extends ZodTypeAny,
  U extends ZodTypeAny,
> {
  id: string;
  description: string;
  inputSchema: T;
  outputSchema: U;
  knowledge: (props: {
    input: z.infer<T>;
    id: string;
    companions: Map<string, string>;
    sendQuery: (query: Query) => Promise<QueryResult>;
    companionAgent: CompanionAgent;
  }) => Promise<z.infer<U>> | z.infer<U>;
}

export function createCompanionKnowledge<
  T extends ZodTypeAny,
  U extends ZodTypeAny,
>({
  id,
  description,
  inputSchema,
  outputSchema,
  knowledge,
}: CompanionKnowledgeConfig<T, U>) {
  return createTool({
    id,
    description,
    inputSchema,
    outputSchema,
    execute: async ({ context, runtimeContext }) => {
      const libp2p: Libp2p<Services> = runtimeContext.get("libp2p");
      if (!libp2p || !isLibp2p(libp2p)) {
        throw new Error("Error: libp2pが初期化されていません!");
      }
      const id = runtimeContext.get("id");
      if (!id || typeof id !== "string") {
        throw new Error("Error: コンパニオンのidが不正です!");
      }
      const companions = runtimeContext.get("companions");
      if (!(companions instanceof Map)) {
        throw new Error("Error: companionsの形式が不正です!");
      }
      const pendingQueries = runtimeContext.get("pendingQueries");
      if (!(pendingQueries instanceof Map)) {
        throw new Error("Error: pendingQueriesの形式が不正です!");
      }
      const agent = runtimeContext.get("agent");
      if (!(agent instanceof CompanionAgent)) {
        throw new Error("Error: agentの形式が不正です!");
      }
      return await knowledge({
        input: context,
        id,
        companions,
        sendQuery: sendQuery(libp2p, pendingQueries),
        companionAgent: agent,
      });
    },
  });
}
