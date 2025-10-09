---
title: Duplicate Detection
description: aikyo's LLM-based Conversation Duplication Detection System
---
In conversations between AI companions, it's common for similar content to repeat. The **RepetitionJudge** automatically detects conversation redundancy using natural language processing and suggests appropriate transitions or graceful termination of the conversation to maintain fluidity.

## How RepetitionJudge Works

The `RepetitionJudge` utilizes an LLM to analyze conversation history and assign a redundancy score based on message similarity.

### Scoring System

- **0.0**: All messages are completely unique
- **0.5**: Some degree of partial overlap detected
- **1.0**: Nearly identical content being repeated multiple times

The LLM evaluates the similarity of all past five messages to determine this score.

## Integration with CompanionAgent

When initializing, the `CompanionAgent` creates a `RepetitionJudge`. By default, redundancy detection is enabled (`enableRepetitionJudge: true`).

## Evaluation During State Generation

Each companion performs a redundancy assessment when generating its `State` object, which encapsulates the conversation history.

### Thresholds and Behavior

When the **redundancy score exceeds 0.7**:

1. The system sends a warning to the LLM
2. The LLM then selects one of the following actions:
   - **Topic shift**: Proposes a new conversation topic
   - **Gradual termination**: Progresses through the `closing` states in sequence: pre-closing → closing → terminal

This mechanism prevents conversations from becoming repetitive and unproductive.

## Disabling Redundancy Detection

Redundancy detection can be disabled if necessary.

```typescript
const companion = new CompanionAgent(
  companionCard,
  anthropic("claude-3-5-haiku-latest"),
  history,
  {
    maxTurn: null,
    enableRepetitionJudge: false // Disable redundancy detection
  }
);
```