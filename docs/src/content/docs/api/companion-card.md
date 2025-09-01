---
title: コンパニオンカードスキーマ
description: Companion Card APIの詳細仕様
---

## CompanionCard

```typescript
export const CompanionSchema = z.object({
  metadata: MetadataSchema,
  role: z.string(),
  actions: z.record(z.instanceof(Tool)),
  knowledge: z.record(z.instanceof(Tool)),
  events: z.object({
    params: z.record(z.string(), z.any()),
    conditions: z.array(
      z.object({
        expression: z.string(),
        execute: z.array(
          z.object({
            instruction: z.string(),
            tool: z.instanceof(Tool),
          }),
        ),
      }),
    ),
  }),
});
```

## CompanionMetadata

コンパニオンの基本情報を定義します。

```typescript
export const MetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  personality: z.string(),
  story: z.string(),
  sample: z.string(),
});
```

### フィールド詳細

#### `id: string`

- **必須**: はい
- **形式**: `companion_` + UUID
- **例**: `"companion_bebf00bb-8a43-488d-9c23-93c40b84d30e"`
- **説明**: P2Pネットワーク内でコンパニオンを識別する一意のID

#### `name: string`

- **必須**: はい
- **例**: `"高橋ポルカ"`
- **説明**: コンパニオンの表示名

#### `personality: string`

- **必須**: はい
- **例**: `"元気で明るくて難しいことを考えるのが苦手な性格です。"`
- **説明**: LLMがキャラクター性を理解するための性格設定

#### `story: string`

- **必須**: はい
- **例**: `"L高 浅草サテライトの1年生。明るく元気な性格で..."`
- **説明**: コンパニオンの背景ストーリー

#### `sample: string`

- **必須**: はい
- **例**: `"翔音ちゃんが見せてくれた昔のスクールアイドルの動画..."`
- **説明**: 話し方や文体のサンプル

## CompanionEvents

コンパニオンの判断システムを定義します。

```typescript
export const EventCondition = z.object({
  expression: z.string(),
  execute: z.array(
    z.object({
      instruction: z.string(),
      tool: z.instanceof(Tool),
    }),
  ),
});

events: z.object({
  params: z.record(z.string(), z.any()),
  conditions: z.array(EventCondition),
});
```

### フィールド詳細

#### `params: Record<string, any>`

LLMが判断すべきパラメータをJSON Schemaで定義します。
必ず、JSON、Schemaで記述する必要があることに注意してください。

```typescript
params: {
  title: "判断パラメータ",
  description: "状況に応じて適切な値を設定してください",
  type: "object",
  properties: {
    interaction_type: {
      description: "交流してきた人のタイプ",
      enum: ["user", "companion"],
      type: "string"
    },
    need_reply: {
      description: "返事が必要かどうか",
      type: "boolean"
    }
  },
  required: ["interaction_type","need_reply"]
}
```

#### `conditions: EventCondition[]`

実行条件と対応するアクションを定義します。

```typescript
conditions: [
  {
    expression: 'interaction_type === "user" && need_reply === true',
    execute: [
      {
        instruction: "ユーザーに適切に応答する",
        tool: speakAction,
      },
    ],
  },
];
```
