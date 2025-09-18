---
title: CompanionCard
description: Companion Card のAPIスキーマ詳細仕様
---

## CompanionSchema

```typescript
import { z } from "zod";
import { Tool } from "@mastra/core";

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
```

---

### `metadata`

コンパニオンの基本情報を定義します。

- **スキーマ**: `MetadataSchema`

```typescript
export const MetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  personality: z.string(),
  story: z.string(),
  sample: z.string(),
});
```

- `id`: `companion_`から始まる一意のID。
- `name`: コンパニオン名。
- `personality`: LLMが性格を理解するための説明。
- `story`: 背景設定。
- `sample`: 話し方のサンプル。

### `role`

コンパニオンの役割を文字列で定義します。

- **型**: `string`
- **例**: `"あなたはフレンドリーなアシスタントです。"`

### `actions`

コンパニオンが使用できる`Action`ツールをまとめたオブジェクトです。

- **型**: `Record<string, Tool>`
- **キー**: アクション名
- **値**: `createCompanionAction`で作成したツールインスタンス

### `knowledge`

コンパニオンが使用できる`Knowledge`ツールをまとめたオブジェクトです。

- **型**: `Record<string, Tool>`
- **キー**: ナレッジ名
- **値**: `createCompanionKnowledge`で作成したツールインスタンス

### `events`

コンパニオンの自律的な判断と行動のルールを定義します。

#### `events.params`

LLMに状況を判断させるための項目をJSON Schema形式で定義します。

- **型**: `Record<string, any>` (JSON Schemaオブジェクト)
- **例**:
  ```json
  {
    "title": "状況判断パラメータ",
    "type": "object",
    "properties": {
      "need_reply": {
        "description": "相手の発言に返信が必要か",
        "type": "boolean"
      }
    },
    "required": ["need_reply"]
  }
  ```

#### `events.conditions`

`params`での判断結果に基づき、ツールを実行するための条件分岐を定義します。

- **スキーマ**: `EventCondition[]`

```typescript
export const EventCondition = z.object({
  expression: z.string(), // CEL式
  execute: z.array(
    z.object({
      instruction: z.string(),
      tool: z.instanceof(Tool),
    }),
  ),
});
```

- `expression`: `params`の値を元にしたCEL式。
- `execute`: `expression`がtrueの場合に実行されるツールの配列。
  - `instruction`: LLMへの実行指示。
  - `tool`: 実行するツールインスタンス。
