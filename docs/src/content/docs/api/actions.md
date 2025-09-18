---
title: Action API
description: Companion Action APIの詳細仕様
---

`Action`は、コンパニオンがP2Pネットワークにデータを送信する「行動」を定義するためのツールです。

## createCompanionAction

`Action`ツールを作成するためのファクトリ関数です。

- **インポート元**: `@aikyo/utils`

### 関数シグネチャ

```typescript
import { createCompanionAction, type CompanionActionConfig } from "@aikyo/utils";

function createCompanionAction<T extends z.ZodSchema>(
  config: CompanionActionConfig<T>
): Tool;
```

### 設定オブジェクト (CompanionActionConfig)

```typescript
import type { Action, Message, CompanionAgent, QueryResult } from "@aikyo/server";
import type { Libp2p } from "libp2p";

// publish関数が返す型
type Output = Action | Message;

interface CompanionActionConfig<T extends z.ZodSchema> {
  id: string;
  description: string;
  inputSchema: T;
  topic: "actions" | "messages";
  publish: (props: {
    input: z.infer<T>;
    id: string; // コンパニオン自身のID
    companions: Map<string, string>; // ネットワーク上のコンパニオン一覧
    libp2p: Libp2p<Services>; // libp2pインスタンス
    pendingQueries: Map<string, { resolve, reject }>;
    companionAgent: CompanionAgent;
  }) => Promise<Output> | Output;
}
```

#### フィールド詳細

##### `id: string`

- **必須**: はい
- **説明**: アクションを識別するための一意なID文字列です。

##### `description: string`

- **必須**: はい
- **説明**: LLMがこのアクションの目的を理解し、いつ使用すべきかを判断するための説明文です。

##### `inputSchema: T`

- **必須**: はい
- **型**: Zodスキーマ
- **説明**: LLMに生成してほしいパラメータの構造を定義します。

##### `topic: string`

- **必須**: はい
- **値**: `"messages"` | `"actions"`
- **説明**: `publish`関数が返したデータをどのP2Pトピックに送信するかを指定します。

##### `publish: Function`

- **必須**: はい
- **説明**: LLMが生成した`input`と実行時コンテキスト`props`を受け取り、P2Pネットワークに送信するデータオブジェクトを生成して返す関数です。非同期処理も可能です。