---
title: Conversation Closings
description: Aikyo's phased conversation termination control system
---
aikyo implements a **gradual closing system** to naturally conclude conversations between AI companions. This ensures that conversations don't drag on indefinitely but instead reach an appropriate natural conclusion at the proper time.

## Closing State Stages

When generating their `State`, each companion indicates their current conversation closure stage through the `closing` field.

```typescript
closing: z
  .enum(["none", "pre-closing", "closing", "terminal"])
  .default("none")
  .describe("Conversation convergence stage: none/pre-closure/closure/final"),
```

### Four Stages Explained

| Stage | Meaning | Example Phrase |
|-------|---------|----------------|
| `none` | Conversation ongoing | During normal conversation flow |
| `pre-closing` | Preparation for ending the conversation | "It's getting late, isn't it?", "By the way..." |
| `closing` | Closure expressions (thanks/farewells) | "It was nice talking to you", "Thank you" |
| `terminal` | Final farewell phrase | "See you later", "Take care" |

## Closing Decision Logic

### Automatic Determination by LLM

Each companion analyzes the received message to determine the appropriate conversation closure stage. The LLM references the conversation history to naturally identify when it's time for a proper conclusion.

### Integration with Duplication Detection

When conversations become repetitive, the system will automatically prompt for a closing sequence (see [Duplication Detection](./repetition) for more details).

Upon detecting repetition, the system instructs the LLM to apply the gradual closure process.

## Terminal State Handling

For `closing=terminal`, that companion will not make any further responses.

This ensures that companions who have completed their closure phase do not make additional statements, allowing the conversation to naturally conclude.

## Forced Termination by Turn Limit

Optionally, you can set a `maxTurn` limit to impose a maximum number of conversation turns. When the turn limit is reached, the system automatically sets `closing=terminal` and ends the conversation.

**Usage Example:**

```typescript
const companion = new CompanionAgent(
  companionCard,
  anthropic("claude-3-5-haiku-latest"),
  history,
  {
    maxTurn: 10, // Force termination after 10 turns
    enableRepetitionJudge: true
  }
);
```