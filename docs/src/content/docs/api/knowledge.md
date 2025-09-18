---
title: Knowledge API
description: Companion Knowledge APIの詳細仕様
---

`Knowledge`は、コンパニオンがLLMの判断材料として、外部や内部の状態を動的に取得するためのツールです。

## createCompanionKnowledge

`Knowledge`ツールを作成するためのファクトリ関数です。

- **インポート元**: `@aikyo/utils`

### 関数シグネチャ

```typescript
import { createCompanionKnowledge, type CompanionKnowledgeConfig } from "@aikyo/utils";

function createCompanionKnowledge<
  T extends ZodTypeAny,
  U extends ZodTypeAny
>(
  config: CompanionKnowledgeConfig<T, U>
): Tool;
```

### 設定オブジェクト (CompanionKnowledgeConfig)

```typescript
import type { CompanionAgent, QueryResult } from "@aikyo/server";
import type { Libp2p } from "libp2p";

interface CompanionKnowledgeConfig<
  T extends ZodTypeAny, // Input schema
  U extends ZodTypeAny  // Output schema
> {
  id: string;
  description: string;
  inputSchema: T;
  outputSchema: U;
  knowledge: (props: {
    input: z.infer<T>;
    id: string; // コンパニオン自身のID
    companions: Map<string, string>; // ネットワーク上のコンパニオン一覧
    libp2p: Libp2p<Services>; // libp2pインスタンス
    pendingQueries: Map<string, { resolve, reject }>;
    companionAgent: CompanionAgent;
  }) => Promise<z.infer<U>> | z.infer<U>;
}
```

#### フィールド詳細

##### `id: string`

- **必須**: はい
- **説明**: ナレッジを識別するための一意なID文字列です。

##### `description: string`

- **必須**: はい
- **説明**: LLMがこのナレッジの目的を理解し、いつ使用すべきかを判断するための説明文です。

##### `inputSchema: T`

- **必須**: はい
- **型**: Zodスキーマ
- **説明**: LLMに生成してほしいパラメータの構造を定義します。

##### `outputSchema: U`

- **必須**: はい
- **型**: Zodスキーマ
- **説明**: `knowledge`関数が返す知識のデータ構造を定義します。このスキーマに沿った情報がLLMに提供されます。

##### `knowledge: Function`

- **必須**: はい
- **説明**: LLMが生成した`input`と実行時コンテキスト`props`を受け取り、外部APIへのアクセスや内部情報の参照などを行って、`outputSchema`に定義された形式の知識を返す関数です。非同期処理も可能です。