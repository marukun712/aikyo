---
title: Conversation Closings
description: Aikyo's phased conversation termination control system
---
aikyo implements a **gradual closing system** to naturally conclude conversations between AI companions. This ensures that discussions don't continue indefinitely and are properly concluded at appropriate moments.

## Closing Stage Fields

When generating its `State`, each companion indicates its current conversation closure stage through the `closing` field.

```typescript
closing: z
  .enum(["none", "pre-closing", "closing", "terminal"])
  .default("none")
  .describe("Conversation convergence stage: none/pre-closure/closure/termination"),
```

### The Four Stages

| Stage | Meaning | Example Phrase |
|-------|---------|----------------|
| `none` | Conversation continues | During normal conversation flow |
| `pre-closing` | Preparation for ending the conversation | "It's getting late, isn't it?" / "By the way..." |
| `closing` | Closing expressions (thanks/farewells, etc.) | "It was nice talking to you" / "Thank you" |
| `terminal` | Final farewell phrase | "See you later" / "Take care" |

## Decision Logic for Determining When to Close

### Automatic Determination by LLM

Each companion analyzes the incoming message context to determine the appropriate `closing` stage. The LLM references the conversation history to determine a natural point for concluding the discussion.

### Integration with Duplication Detection

When conversations become repetitive, the system will automatically prompt for a closing (see [Duplication Detection](./repetition) for more details).

Upon detecting repetition, the system instructs the LLM to proceed with the gradual closure process.

## Handling When `closing=terminal` is Set

If `closing=terminal` is set, that companion will not make any subsequent statements.

This ensures that companions who have completed their closing do not make any further responses, allowing the conversation to naturally reach its conclusion.

## Forced Termination by Turn Limit

Optionally, you can set a `maxTurn` limit to establish an upper bound on conversation turns. When the turn limit is reached, the system automatically sets `closing=terminal` and ends the conversation.

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
