---
title: ターンテイキング
description: aikyoのターンテイキングシステムによる会話順序制御
---

aikyoでは、複数のAIコンパニオンが自然に会話を進めるために**ターンテイキングシステム**を実装しています。このシステムにより、誰がいつ発言するかが自動的に決定されます。

## ターンテイキングの仕組み

### 全体の流れ

1. メッセージを受信したコンパニオンは`State`（状態）を生成
2. 全コンパニオンが`states`トピックに`State`をパブリッシュ
3. `TurnTakingManager`が全員の`State`を収集
4. 投票に基づいて次の発言者を選出
5. 選出されたコンパニオンが発言を実行

## State（状態）の生成

各コンパニオンは会話履歴全体を元に、自分の状態を判断します。

### Stateの構造

```typescript
export const StateBodySchema = z.object({
  from: z.string(),
  messageId: z.string().describe("このstateが対応する元のメッセージのID"),
  state: z
    .enum(["speak", "listen"])
    .describe("次に発言をしたいか、聞く姿勢に入りたいか"),
  importance: z
    .number()
    .min(0)
    .max(10)
    .describe("会話の文脈におけるあなたが次にしたい発言の重要度"),
  selected: z
    .boolean()
    .describe("前回の発言者の発言で、あなたに発言を求められているかどうか"),
  closing: z
    .enum(["none", "pre-closing", "closing", "terminal"])
    .default("none")
    .describe("会話の収束段階:なし/事前クロージング/クロージング/終端"),
}).strict();
export type StateBody = z.infer<typeof StateBodySchema>;
```

**重要なフィールド:**

- **state**: `speak`（発言したい）か`listen`（聞く姿勢）
- **importance**: 0-10のスコア（高いほど優先される）
- **selected**: 名指しされているかどうか
- **closing**: 会話終了の意思（詳細は[会話クロージング](./closing)を参照）

## TurnTakingManagerによる発言者選出

`TurnTakingManager`は全コンパニオンの`State`を収集し、発言者を決定します。

### State収集

参加者全員の`State`が集まるまで待機し、全員の投票が揃った時点で次のステップに進みます。

### 発言者選出

**優先順位:**

1. **名指しされたコンパニオン (`selected=true`)**: その中で最高`importance`
2. **発言希望コンパニオン (`state=speak`)**: その中で最高`importance`
3. **該当なし**: 発言者なしで終了

### 発言実行

選出されたコンパニオンが自分である場合、設定された待機時間後に発言を実行します。`closing=terminal`の場合は発言を行わず、会話を終了します。
