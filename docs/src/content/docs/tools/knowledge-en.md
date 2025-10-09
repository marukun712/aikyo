---
title: Knowledge (Tool)
description: Details and API specifications for aikyo's Knowledge (knowledge tool)
---
**Knowledge** is a tool designed to provide dynamic knowledge to your AI companion. It can retrieve information from external data sources or APIs and incorporate it into conversations and actions.

## Features of Knowledge

- **Read-only operation**: Only retrieves information without sending it externally or modifying any state.
- **Dynamic retrieval**: Fetches the most up-to-date information at runtime rather than using pre-trained knowledge.
- **Flexible integration**: Can work with P2P networks and client queries.

## createCompanionKnowledge API

Use the `createCompanionKnowledge` function to create a Knowledge tool:

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

| Field       | Type    | Description                           |
|-------------|---------|---------------------------------------|
| `id`        | `string` | Unique identifier for the tool        |
| `description` | `string` | Tool description (referenced by LLM when selecting tools) |
| `inputSchema` | `ZodTypeAny` | Input schema (using Zod schema)       |
| `outputSchema` | `ZodTypeAny` | Output schema (using Zod schema)     |
| `knowledge` | `function` | Knowledge retrieval function          |

#### props for the knowledge function

| Property    | Type    | Description                             |
|-------------|---------|-----------------------------------------|
| `input`     | `z.infer<T>` | Input data as defined by inputSchema    |
| `id`        | `string`  | ID of the companion                      |
| `companions` | `Map<string, string>` | List of connected companions             |
| `sendQuery` | `function` | Function to send Queries to the client   |
| `companionAgent` | `CompanionAgent` | Instance of the companion agent          |

## Implementation Example

### 1. companionNetworkKnowledge

A Knowledge tool that retrieves a list of currently connected companions.

```typescript
export const companionNetworkKnowledge = createCompanionKnowledge({
  id: "companions-network",
  description:
    "Retrieves a list of companions belonging to the same network.",
  inputSchema: z.object({}),
  outputSchema: z.string(),
  knowledge: async ({ companions }) =>
    Array.from(companions.entries())
      .map((metadata) => JSON.stringify(metadata, null, 2))
      .join("\n"),
});
```

**Operation:**

1. Fetches metadata for all connected companions from the `companions` Map.
2. Converts the data into JSON-formatted strings and returns it.
3. The LLM can reference this information to influence the conversation.

## Registration in CompanionCard

The created Knowledge tool should be registered in the `knowledge` field of a `CompanionCard`:

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

The LLM will automatically execute the registered Knowledge tools as needed.