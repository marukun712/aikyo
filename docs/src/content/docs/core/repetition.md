---
title: 重複検出
description: aikyoのLLMベース会話重複検出システム
---

AIコンパニオン間の会話では、同じような内容が繰り返されることがあります。aikyoは**RepetitionJudge**により会話の重複を自動検出し、自然な話題転換や会話終了を促します。

## RepetitionJudgeの仕組み

`RepetitionJudge`は、LLMを使用して会話履歴を分析し、重複度をスコア化します。

```typescript
import type { MetricResult } from "@mastra/core";
import type { LanguageModel } from "@mastra/core/llm";
import { MastraAgentJudge } from "@mastra/evals/judge";
import { z } from "zod";

const INSTRUCTIONS = `You are a repetition detection expert. Evaluate the messages in a conversation and score how repetitive they are. If they are identical or nearly identical, score close to 1. If they are all unique, score 0.`;

const generatePrompt = (memory: string[]) => `
Here are the last 5 messages:
${memory.map((m) => m).join("\n")}

Evaluate how repetitive these messages are.

Return:
{
  "score": number (0 to 1),
  "info": {
    "reason": string,
  }
}
`;

export class RepetitionJudge extends MastraAgentJudge {
  constructor(model: LanguageModel) {
    super("RepetitionJudge", INSTRUCTIONS, model);
  }

  async evaluate(memory: string[]): Promise<MetricResult> {
    const prompt = generatePrompt(memory);
    const result = await this.agent.generate(prompt, {
      output: z.object({
        score: z.number().min(0).max(1),
        info: z.object({
          reason: z.string(),
        }),
      }),
    });

    return result.object;
  }
}
```

### スコアリング

- **0.0**: 全てのメッセージがユニーク
- **0.5**: 部分的に重複がある
- **1.0**: ほぼ同一の内容が繰り返されている

LLMが過去5メッセージを分析し、内容の類似度を評価します。

## CompanionAgentでの統合

`CompanionAgent`は初期化時に`RepetitionJudge`を作成します。

```typescript
export class CompanionAgent implements ICompanionAgent {
  repetitionJudge: RepetitionJudge;
  config: { maxTurn: number | null; enableRepetitionJudge: boolean };

  constructor(
    companion: CompanionCard,
    model: LanguageModel,
    history: Message[],
    config?: { maxTurn: number | null; enableRepetitionJudge: boolean },
  ) {
    // ...
    this.repetitionJudge = new RepetitionJudge(model);
    this.config = config
      ? config
      : { maxTurn: null, enableRepetitionJudge: true };
  }
}
```

デフォルトで重複検出は有効(`enableRepetitionJudge: true`)です。

## State生成時の評価

各コンパニオンは`State`を生成する際に、会話履歴の重複度を評価します。

```typescript
async generateState(message: Message): Promise<State> {
  ...
  if (this.config.enableRepetitionJudge) {
    const formatted = this.history.map((message) => message.params.message);
    const result = await this.repetitionJudge.evaluate(formatted);
    logger.info({ result }, "Repetition judge evaluation");
    const repetition = result.score;
    if (repetition > 0.7) {
      closingInstruction =
        "最重要:会話が繰り返しになっています。直ちにclosingをpre-closing,closing,terminalの順に変えて終了するか、話題を変えてください。";
    }
  }
  ...
}
```

### 閾値と動作

**重複スコア >= 0.7** の場合:

1. システムがLLMに警告を送信
2. LLMは以下のいずれかを選択:
   - **話題転換**: 新しいトピックを提案
   - **段階的終了**: `closing`を`pre-closing` → `closing` → `terminal`と進める

これにより、会話が堂々巡りになるのを防ぎます。

## 重複検出の無効化

必要に応じて重複検出を無効化できます。

```typescript
const companion = new CompanionAgent(
  companionCard,
  anthropic("claude-3-5-haiku-latest"),
  history,
  {
    maxTurn: null,
    enableRepetitionJudge: false // 重複検出を無効化
  }
);
```