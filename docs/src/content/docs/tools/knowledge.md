---
title: Knowledge Tool
description: Details and API specifications for aikyo's Knowledge (knowledge tool)
---

**Knowledge** is a tool designed to dynamically equip your AI companion with
knowledge. It enables the retrieval of information from external data sources
and APIs, which can be then incorporated into conversations or actions.

## Key Features of Knowledge

- **Read-only operation**: Only retrieves information; does not transmit it
  externally or modify any states.
- **Dynamic retrieval**: Fetches the most up-to-date information at runtime
  rather than relying on pre-trained knowledge.
- **Flexible integration**: Can be integrated with P2P networks and client
  queries.

## createCompanionKnowledge API

Use the `createCompanionKnowledge` function to instantiate a Knowledge tool.

```typescript
export function createCompanionKnowledge<
  T extends ZodTypeAny,
  U extends ZodTypeAny,
>({
  id,
  description,
  inputSchema,
  outputSchema,
  knowledge,
}: CompanionKnowledgeConfig<T, U>)
```

### Parameters

#### CompanionKnowledgeConfig

```typescript
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
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Tool unique identifier |
| `description` | `string` | Tool description for LLM |
| `inputSchema` | `ZodTypeAny` | Input schema (Zod) |
| `outputSchema` | `ZodTypeAny` | Output schema (Zod) |
| `knowledge` | `function` | Knowledge retriever |

#### props for the knowledge function

| Property | Type | Description |
|----------|------|-------------|
| `input` | `z.infer<T>` | Input from schema |
| `id` | `string` | Companion ID |
| `companions` | `Map<string, string>` | Connected companions |
| `sendQuery` | `function` | Query sender |
| `companionAgent` | `CompanionAgent` | Agent instance |

## Implementation Example

### 1. companionNetworkKnowledge

A Knowledge tool that retrieves a list of companions currently on the same
network.

```typescript
export const companionNetworkKnowledge = createCompanionKnowledge({
  id: "companions-network",
  description:
    "Retrieves the list of companions belonging to the same network.",
  inputSchema: z.object({}),
  outputSchema: z.string(),
  knowledge: async ({ companions }) =>
    Array.from(companions.entries())
      .map((metadata) => JSON.stringify(metadata, null, 2))
      .join("\n"),
});
```

**Functionality:**

1. Fetches metadata for all connected companions from the `companions` Map.
2. Converts the data into JSON-formatted strings and returns it.
3. The LLM can reference this information when processing conversations.

## Registration with CompanionCard

The created Knowledge tool should be registered in the `knowledge` field of a
`CompanionCard`.

```typescript
export const companionCard: CompanionCard = {
  metadata: { /* ... */ },
  role: "...",
  actions: { speakTool },
  knowledge: {
    companionNetworkKnowledge,
    visionKnowledge
  },
  events: { /* ... */ }
};
```

The LLM will automatically execute the registered Knowledge tools as
needed.
