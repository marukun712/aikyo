---
title: Knowledge API
description: Companion Knowledge APIの詳細仕様
---

## createCompanionKnowledge

Mastraツールを作成するファクトリー関数です。

### 関数シグネチャ

```typescript
function createCompanionKnowledge<T extends z.ZodSchema>({
  id,
  description,
  inputSchema,
  topic,
  publish,
}: CompanionActionConfig<T>): Tool;
```

### CompanionKnowledgeConfig

```typescript
interface CompanionKnowledgeConfig<T extends z.ZodSchema> {
  id: string;
  description: string;
  inputSchema: T;
  knowledge: (input: z.infer<T>) => Promise<string> | string;
}
```

#### フィールド詳細

##### `id: string`

- **必須**: はい
- **例**: `"environment-db"`, `"user-preferences"`, `"weather-info"`
- **説明**: ナレッジの一意識別子

##### `description: string`

- **必須**: はい
- **例**: `"部屋の環境情報を取得します"`
- **説明**: LLMがナレッジの目的を理解するための説明

##### `inputSchema: T`

- **必須**: はい
- **型**: Zodスキーマ
- **説明**: LLMから受け取るパラメータの定義

##### `knowledge: Function`

- **必須**: はい
- **戻り値**: `string` または `Promise<string>`
- **説明**: LLMに渡される知識の構造を定義する関数
