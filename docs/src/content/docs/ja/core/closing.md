---
title: 会話クロージング
description: aikyoの段階的な会話終了制御システム
---

aikyoでは、AIコンパニオン間の会話を自然に終了させるために**段階的なクロージングシステム**を実装しています。これにより、会話が延々と続くことなく、適切なタイミングで終了できます。

## Closingフィールドの段階

各コンパニオンは`State`生成時に、会話の終了段階を`closing`フィールドで表明します。

```typescript
closing: z
  .enum(["none", "pre-closing", "closing", "terminal"])
  .default("none")
  .describe("会話の収束段階:なし/事前クロージング/クロージング/終端"),
```

### 4つの段階

| 段階 | 意味 | 例 |
|------|------|-----|
| `none` | 会話継続 | 通常の会話中 |
| `pre-closing` | 会話を終わりに向ける布石 | 「そろそろ時間だね」「ところで…」 |
| `closing` | クロージング表現（感謝・挨拶など） | 「話せて楽しかったよ」「ありがとう」 |
| `terminal` | 最後の別れの挨拶 | 「それじゃあね」「またね」 |

## Closingの判断ロジック

### LLMによる自動判断

各コンパニオンは受信したメッセージから会話の文脈を読み取り、適切な`closing`段階を判断します。LLMは会話履歴を参照しながら、自然な終了タイミングを判断します。

### 重複検出との連携

会話が繰り返しになっている場合、強制的にクロージングを促します（詳細は[重複検出](./repetition)を参照）。

重複が検出されると、システムがLLMに対して段階的にクロージングするよう指示します。

## Terminal時の処理

`closing=terminal`の場合、そのコンパニオンは発言を実行しません。

これにより、クロージングが完了したコンパニオンは新たな発言を行わず、会話が自然に収束します。

## ターン上限による強制終了

オプションで`maxTurn`を設定することで、会話のターン数に上限を設けることができます。ターン上限に達すると、自動的に`closing=terminal`が設定され、会話が終了します。

**使用例:**

```typescript
const companion = new CompanionAgent(
  companionCard,
  anthropic("claude-3-5-haiku-latest"),
  history,
  {
    maxTurn: 10, // 10ターンで強制終了
    enableRepetitionJudge: true
  }
);
```
