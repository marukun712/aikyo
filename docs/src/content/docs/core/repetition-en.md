---
title: Duplicate Detection
description: Aikyo's LLM-based Conversation Duplication Detection System
---
In conversations between AI companions, it's common for similar content to repeat. **RepetitionJudge** automatically detects conversation redundancy using the `RepetitionJudge` mechanism and facilitates natural topic transitions or graceful conversation termination.

## How RepetitionJudge Works

The `RepetitionJudge` utilizes an LLM to analyze the conversation history and assign a redundancy score.

### Scoring System

- **0.0**: All messages are completely unique
- **0.5**: Some partial overlap detected
- **1.0**: Nearly identical content repeated multiple times

The LLM examines the last five messages and evaluates their similarity levels.

## Integration with CompanionAgent

The `CompanionAgent` creates an instance of `RepetitionJudge` during initialization. By default, redundancy detection is enabled (`enableRepetitionJudge: true`).

## Evaluation During State Generation

Each companion evaluates the conversation history's redundancy level when generating its `State`.

### Thresholds and Behavior

**When the redundancy score exceeds 0.7**:

1. The system sends a warning to the LLM
2. The LLM then selects one of the following actions:
   - **Topic transition**: Suggests a new topic
   - **Gradual conclusion**: Progresses through `closing` states from `pre-closing` → `closing` → `terminal`

This prevents conversations from getting stuck in repetitive loops.

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