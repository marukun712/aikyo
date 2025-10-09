---
title: Action (Behavior Tool)
description: Details and API specifications for AIKYO's Action Tool
---
**Actions** are tools that provide a physical presence for your AI companion. They enable communication with P2P networks and clients by sending messages or performing actions to external environments.

## Key Features of Actions

- **Notification to Clients**: Has an impact on external systems, such as sending messages to P2P networks or notifying clients.
- **Declarative Execution**: Defines tool execution through CEL expressions using declarative syntax.

## createCompanionAction API

Use the `createCompanionAction` function to create an Action tool:

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

| Field       | Type           | Description                                              |
|-------------|----------------|----------------------------------------------------------|
| `id`        | `string`       | Unique identifier for the tool                           |
| `description` | `string`     | Tool description (referenced by LLMs when selecting tools) |
| `inputSchema` | `ZodTypeAny` | Input schema defined using Zod schemas                   |
| `topic`     | `"actions"` \| `"messages"` | Topic for publishing messages               |
| `publish`   | `function`      | Message generation function                              |

#### props for the publish function

| Property   | Type           | Description                                               |
|------------|----------------|-----------------------------------------------------------|
| `input`    | `z.infer<T>`   | Input data as defined by the inputSchema                  |
| `id`       | `string`       | ID of the companion                                        |
| `companions` | `Map<string, string>` | List of connected companions               |
| `sendQuery` | `function`     | Function to send a Query to the client               |
| `companionAgent` | `CompanionAgent` | Instance of the companion agent                           |

#### Return Type (Output)

```typescript
type Output = Action | Message;
```

- **Message**: Conversational messages between companions
- **Action**: Notification actions for clients

## Implementation Example

### speakTool (Conversational Message Sender)

The most basic Action tool that sends conversational messages between companions:

```typescript
export const speakTool = createCompanionAction({
  id: "speak",
  description: "Speak a message.",
  inputSchema: z.object({
    message: z.string(),
    to: z
      .array(z.string())
      .describe("Recipient of this message. Please specify the companion's ID. Always include all companions who have participated in the conversation unless addressing a specific companion privately. Also, actively involve the user in conversations."),
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
2. Generates and sends a Query with `type: "speak"` to the client for voice synthesis or other purposes
3. Generates data in the `Message` type format
4. Publishes to the `messages` topic

## Registration in CompanionCard

The created Action tool should be registered under the `actions` field of `CompanionCard`:

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