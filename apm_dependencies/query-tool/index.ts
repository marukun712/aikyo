import { createCompanionKnowledge } from "@aikyo/utils";
import type { QueryRequest } from "@aikyo/utils/schema";
import z from "zod";

const pending = new Map<string, Promise<string>>();

export const visionKnowledge = createCompanionKnowledge({
  id: "vision-knowledge",
  description: "視覚情報を取得します。",
  inputSchema: z.object({}),
  knowledge: async ({ id, libp2p }) => {
    const query: QueryRequest = {
      id: crypto.randomUUID(),
      from: id,
    };
    libp2p.services.pubsub.publish(("queries"), new TextEncoder().encode(JSON.stringify(query)));
    
  },
});
