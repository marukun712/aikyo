---
title: Turn-taking
description: Conversation sequence control using aikyo's turn-taking system
---
In aikyo, we have implemented a **turn-taking system** to enable multiple AI companions to naturally progress conversations. This system automatically determines who speaks and when.

## How Turn Taking Works

### Overall Process

1. The companion receiving a message generates a `State` object.
2. All companions publish their `State` objects to the `states` topic.
3. The `TurnTakingManager` collects all available `States` from everyone.
4. Based on votes, it selects the next speaker.
5. The selected companion then delivers their turn.

## Generating State Objects

Each companion determines its state based on the complete conversation history.

### Structure of a State Object

```typescript
export const StateBodySchema = z.object({
  from: z.string(),          // The ID of the companion generating this state
  messageId: z.string().describe("The ID of the original message this state corresponds to"),
  state: z
    .enum(["speak", "listen"])
    .describe("Whether the companion wants to speak next or enter an listening mode"),
  importance: z
    .number()
    .min(0)
    .max(10)
    .describe("The importance level of the next statement in the conversation context, ranging from 0 to 10"),
  selected: z
    .boolean()
    .describe("Whether the previous speaker's message specifically called this companion to speak next"),
  closing: z
    .enum(["none", "pre-closing", "closing", "terminal"])
    .default("none")
    .describe("Conversation closure phase: none/pre-closure/closure/terminal"),
}).strict();
export type StateBody = z.infer<typeof StateBodySchema>;
```

**Key Fields Explained:**

- **state**: Either `speak` (indicating the desire to speak) or `listen` (entering an listening mode)
- **importance**: A score between 0 and 10, where higher values indicate greater priority
- **selected**: Indicates whether the companion has been specifically called to speak next
- **closing**: Indication of the conversation's closure stage ("none"/"pre-closure"/"closure"/"terminal"; see [Conversation Closing](./closing) for details)

## Speaker Selection by TurnTakingManager

The `TurnTakingManager` collects all companions' `States` and determines the next speaker.

### State Collection Process

It waits until all participants have submitted their `State` objects, then proceeds once every companion has voted.

### Speaker Determination Logic

**Priority Order:**

1. **Companion named by the previous speaker (selected=true)**: Among these, the one with the highest `importance`
2. **Companions expressing a desire to speak (state=speak)**: Among these, the one with the highest `importance`
3. **No suitable candidates**: The turn ends without selecting a speaker

### Executing the Turn

If the selected companion is themselves, they will deliver their statement after waiting for the configured delay time. If `closing=terminal`, they will not make a statement and will instead end the conversation.