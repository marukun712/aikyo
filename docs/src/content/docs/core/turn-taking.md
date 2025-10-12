---
title: Turn-taking
description: Conversation order control using aikyo's turn-taking system
---
aikyo implements a **turn-taking system** to enable multiple AI companions to engage in natural conversation flow. This system automatically determines who should speak and when.

## How Turn Taking Works

### Overall Process

1. The companion receiving a message generates a `State` object.
2. All companions publish their `State` objects to the `states` topic.
3. The `TurnTakingManager` collects all collected `States`.
4. Based on votes, it selects the next speaker.
5. The selected companion then executes its turn.

## Generating State

Each companion determines its own state based on the entire conversation history.

### State Structure

```typescript
export const StateBodySchema = z.object({
  from: z.string(),
  messageId: z.string().describe("The ID of the original message this state corresponds to"),
  state: z
    .enum(["speak", "listen"])
    .describe("Whether you want to speak next or enter listening mode"),
  importance: z
    .number()
    .min(0)
    .max(10)
    .describe("The priority of your next intended statement in the conversation context"),
  selected: z
    .boolean()
    .describe("Indicates whether the previous speaker has specifically called on you to speak"),
  closing: z
    .enum(["none", "pre-closing", "closing", "terminal"])
    .default("none")
    .describe("Conversation closure stage: none/pre-closing/closure/terminal"),
}).strict();
export type StateBody = z.infer<typeof StateBodySchema>;
```

**Key Fields:**

- **state**: Either `speak` (wanting to speak) or `listen` (entering listening mode)
- **importance**: A score between 0-10, where higher values indicate greater priority
- **selected**: Indicates whether you have been specifically called upon
- **closing**: Indication of conversation termination intent (see [Conversation Closure](./closing) for details)

## Speaker Selection by TurnTakingManager

The `TurnTakingManager` collects all companions' `States` to determine who should speak next.

### State Collection

It waits until all participants have submitted their `State` objects, then proceeds once all votes are in.

### Speaker Selection Logic

**Priority Order:**

1. **Named companions (`selected=true`)**: Among these, the one with the highest `importance`
2. **Companions requesting to speak (`state=speak`)**: Among these, the one with the highest `importance`
3. **No eligible candidates**: The turn ends without selection

### Statement Execution

If the selected companion is yourself, you will execute your statement after a predetermined wait period. If `closing=terminal`, no statement will be delivered, and the conversation will conclude.
