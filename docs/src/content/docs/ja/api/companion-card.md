---
title: CompanionCard
description: CompanionCard型の詳細仕様
---

`CompanionCard`は、AIコンパニオンの設定を定義する型です。メタデータ、役割、ツール、イベント条件などをまとめて管理します。

## インポート

```typescript
import type { CompanionCard } from "@aikyo/server";
```

## 型定義

```typescript
export const CompanionSchema = z.object({
  metadata: MetadataSchema,
  role: z.string(),
  actions: z.record(z.instanceof(Tool)),
  knowledge: z.record(z.instanceof(Tool)),
  events: z.object({
    params: z.record(z.string(), z.any()),
    conditions: z.array(EventCondition),
  }),
});

export type CompanionCard = z.infer<typeof CompanionSchema>;
```

## フィールド

### metadata

```typescript
metadata: Metadata
```

コンパニオンのメタデータ情報。

```typescript
export const MetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  personality: z.string(),
  story: z.string(),
  sample: z.string(),
});

export type Metadata = z.infer<typeof MetadataSchema>;
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `id` | `string` | コンパニオンの一意なID（例: `"companion_aya"`） |
| `name` | `string` | 表示名（例: `"aya"`） |
| `personality` | `string` | 性格設定（LLMがロールプレイの参考にする） |
| `story` | `string` | バックストーリー |
| `sample` | `string` | サンプル発言（口調の参考） |

**使用例:**

```typescript
metadata: {
  id: "companion_aya",
  name: "aya",
  personality:
    "落ち着いていてクールな雰囲気を持つが、時折ほんの少し抜けていて親しみやすい一面を見せる。",
  story:
    "自分の関心を大切にしながら、自由なスタイルで研究や創作を続けている。",
  sample:
    "『好きなものについて話してると、つい夢中になっちゃうんだよね。…ちょっと恥ずかしいけど。』",
}
```

### role

```typescript
role: string
```

コンパニオンの役割を記述する文字列。

**使用例:**

```typescript
role: "あなたは、他のコンパニオンやユーザーと積極的に交流します。"
```

### actions

```typescript
actions: Record<string, Tool>
```

コンパニオンが使用できるActionツールのレコード。

**使用例:**

```typescript
actions: {
  speakTool,
  lightControlAction
}
```

Actionツールの作成方法は[Action](../tools/action)を参照。

### knowledge

```typescript
knowledge: Record<string, Tool>
```

コンパニオンが使用できるKnowledgeツールのレコード。

**使用例:**

```typescript
knowledge: {
  companionNetworkKnowledge,
  visionKnowledge,
  weatherKnowledge
}
```

Knowledgeツールの作成方法は[Knowledge](../tools/knowledge)を参照。

### events

```typescript
events: {
  params: JSONSchema;
  conditions: EventCondition[];
}
```

イベント駆動のツール実行設定。

#### events.params

```typescript
params: JSONSchema
```

LLMが評価すべきパラメータのJSONスキーマ。

**使用例:**

```typescript
params: {
  title: "あなたが判断すべきパラメータ",
  description: "descriptionに従い、それぞれ適切に値を代入してください。",
  type: "object",
  properties: {
    already_replied: {
      description: "すでに話したことのある人かどうか",
      type: "boolean",
    },
    need_response: {
      description: "返答の必要があるかどうか",
      type: "boolean",
    },
  },
  required: ["already_replied", "need_response"],
}
```

#### events.conditions

```typescript
conditions: EventCondition[]
```

CEL式による条件とツール実行の配列。

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
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `expression` | `string` | CEL式（例: `"need_response == true"`） |
| `execute` | `array` | マッチ時に実行する指示とツールの配列 |
| `execute[].instruction` | `string` | LLMへの指示文 |
| `execute[].tool` | `Tool` | 使用するツール |

**使用例:**

```typescript
conditions: [
  {
    expression: "already_replied == false",
    execute: [
      {
        instruction: "自己紹介をする。",
        tool: speakTool,
      },
    ],
  },
  {
    expression: "need_response == true",
    execute: [
      {
        instruction: "ツールを使って返信する。",
        tool: speakTool,
      },
    ],
  },
]
```
