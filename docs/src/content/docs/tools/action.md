---
title: Action (Behavior Tool)
description: Details and API specifications for aikyo's Action (behavioral tool)
---
**Actions** are tools that give your AI companion a physical presence. They enable communication and interaction with the external environment by sending messages or actions to P2P networks and clients.

## Key Features of Actions

- **Notification to Clients**: Has the ability to influence external systems, such as sending messages to P2P networks or notifying clients.
- **Declarative Execution**: Defines tool execution through CEL expressions using declarative syntax.

## createCompanionAction API

Use the `createCompanionAction` function to create an Action tool.

```typescript
export function createCompanionAction<T extends ZodTypeAny>({
  id,
  description,
  inputSchema,
  topic,
  publish,
}: CompanionActionConfig<T>)
```

### Parameters

#### CompanionActionConfig

```typescript
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
```

| Field           | Type       | Description                               |
|-----------------|------------|-------------------------------------------|
| `id`            | `string`   | Unique identifier for the tool            |
| `description`   | `string`   | Tool description (referenced by LLM during tool selection) |
| `inputSchema`   | `ZodTypeAny` | Input schema defined using Zod Schema     |
| `topic`         | `"actions"` \| `"messages"`               | Publication topic                       |
| `publish`       | `function` | Message generation function               |

#### publish Function Props

| Property       | Type       | Description                               |
|----------------|------------|-------------------------------------------|
| `input`        | `z.infer<T>` | Input data as defined in inputSchema       |
| `id`           | `string`   | Companion's ID                            |
| `companions`   | `Map<string, string>` | List of connected companions              |
| `sendQuery`    | `function` | Function to send Queries to clients       |
| `companionAgent` | `CompanionAgent` | Instance of the companion agent           |

#### Return Type (Output)

```typescript
type Output = Action | Message;
```

- **Message**: Conversational messages between companions
- **Action**: Notification actions for clients

## Implementation Example

### speakTool (Conversational Message Transmission)

The most basic Action tool that transmits conversational messages between companions.

```typescript
export const speakTool = createCompanionAction({
  id: "speak",
  description: "Speak.",
  inputSchema: z.object({
    message: z.string(),
    to: z
      .array(z.string())
      .describe("Recipient of this message. Always specify the companion's ID. Be sure to include all companions who have participated in the conversation unless you're addressing a specific one. Additionally, actively involve the user in conversations."),
    emotion: z.enum(["happy", "sad", "angry", "neutral"]),
  }),
  topic: "messages",
  publish: async ({ input, id, sendQuery }) => {
    const queryId = crypto.randomUUID();
    const query: Query = {
      jsonrpc: "2.0",
      id: queryId,
      method: "query.send",
      params: {
        from: id,
        type: "speak",
        body: { message: input.message, emotion: input.emotion },
      },
    };
    await sendQuery(query);
    return {
      jsonrpc: "2.0",
      method: "message.send",
      params: {
        id: crypto.randomUUID(),
        from: id,
        to: input.to,
        message: input.message,
        metadata: { emotion: input.emotion },
      },
    };
  },
});
```

**Operation:**

1. Obtains `message`, `to`, and `emotion` from the input
2. Generates and sends a Query with `type: "speak"` to the client (used for voice synthesis, etc.)
3. Generates data in the `Message` type format
4. Publishes to the `messages` topic

## Registration in CompanionCard

The created Action tool should be registered under the `actions` field of the `CompanionCard`.

```typescript
export const companionCard: CompanionCard = {
  metadata: { /* ... */ },
  role: "...",
  actions: {
    speakTool,
    lightControlAction
  },
  knowledge: { /* ... */ },
  events: { /* ... */ }
};
```
