---
title: Action API
description: Companion Action APIの詳細仕様
---

## createCompanionAction

Mastraツールを作成するファクトリー関数です。

### 関数シグネチャ

```typescript
function createCompanionAction<T extends z.ZodSchema>({
  id,
  description,
  inputSchema,
  topic,
  publish,
}: CompanionActionConfig<T>): Tool;
```

### CompanionActionConfig

```typescript
type Output = Action | Context | Message;

interface CompanionActionConfig<T extends z.ZodSchema> {
  id: string;
  description: string;
  inputSchema: T;
  topic: "messages" | "actions" | "contexts";
  publish: (input: z.infer<T>) => Promise<Output> | Output;
}
```

#### フィールド詳細

##### `id: string`

- **必須**: はい
- **例**: `"speak"`, `"gesture"`, `"motion-db-gesture"`
- **説明**: アクションの一意識別子

##### `description: string`

- **必須**: はい
- **例**: `"メッセージを話す。感情も表現できます。"`
- **説明**: LLMがアクションの目的を理解するための説明

##### `inputSchema: T`

- **必須**: はい
- **型**: Zodスキーマ
- **説明**: LLMから受け取るパラメータの定義

##### `topic: string`

- **必須**: はい
- **値**: `"messages"` | `"actions"` | `"contexts"`
- **説明**: P2P通信で使用するトピック

##### `publish: Function`

- **必須**: はい
- **戻り値**: `Output` または `Promise<Output>`
- **説明**: 返り値として戻されたデータをP2Pネットワークに送信する関数
