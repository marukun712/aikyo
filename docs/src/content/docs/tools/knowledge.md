---
title: Knowledge（知識ツール）
description: aikyoのKnowledge（知識ツール）の詳細とAPI仕様
---

**Knowledge**は、AIコンパニオンに動的な知識を与えるためのツールです。外部データソースやAPIから情報を取得し、会話や行動に反映させることができます。

## Knowledgeの特徴

- **取得のみ**: 情報の取得のみで、外部への送信や状態変更は行わない
- **動的取得**: 事前学習済みの知識ではなく、実行時に最新の情報を取得
- **柔軟な統合**: P2Pネットワークやクライアントクエリと連携可能

## createCompanionKnowledge API

`createCompanionKnowledge`関数を使用してKnowledgeツールを作成します。

```typescript
export function createCompanionKnowledge<
  T extends ZodTypeAny,
  U extends ZodTypeAny,
>({
  id,
  description,
  inputSchema,
  outputSchema,
  knowledge,
}: CompanionKnowledgeConfig<T, U>)
```

### パラメータ

#### CompanionKnowledgeConfig

```typescript
export interface CompanionKnowledgeConfig<
  T extends ZodTypeAny,
  U extends ZodTypeAny,
> {
  id: string;
  description: string;
  inputSchema: T;
  outputSchema: U;
  knowledge: (props: {
    input: z.infer<T>;
    id: string;
    companions: Map<string, string>;
    sendQuery: (query: Query) => Promise<QueryResult>;
    companionAgent: CompanionAgent;
  }) => Promise<z.infer<U>> | z.infer<U>;
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `id` | `string` | ツールの一意なID |
| `description` | `string` | ツールの説明（LLMがツール選択時に参照） |
| `inputSchema` | `ZodTypeAny` | 入力スキーマ（Zodスキーマ） |
| `outputSchema` | `ZodTypeAny` | 出力スキーマ（Zodスキーマ） |
| `knowledge` | `function` | 知識取得関数 |

#### knowledge関数のprops

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `input` | `z.infer<T>` | inputSchemaで定義された入力データ |
| `id` | `string` | コンパニオンのID |
| `companions` | `Map<string, string>` | 接続中のコンパニオンリスト |
| `sendQuery` | `function` | クライアントへQueryを送信する関数 |
| `companionAgent` | `CompanionAgent` | コンパニオンエージェントのインスタンス |

## 実装例

### 1. companionNetworkKnowledge

接続中のコンパニオン一覧を取得するKnowledgeツール。

```typescript
export const companionNetworkKnowledge = createCompanionKnowledge({
  id: "companions-network",
  description:
    "同じネットワークに所属しているコンパニオンのリストを取得します。",
  inputSchema: z.object({}),
  outputSchema: z.string(),
  knowledge: async ({ companions }) =>
    Array.from(companions.entries())
      .map((metadata) => JSON.stringify(metadata, null, 2))
      .join("\n"),
});
```

**動作:**

1. `companions` Mapから全コンパニオンのメタデータを取得
2. JSON形式の文字列に変換して返す
3. LLMがこの情報を参照して会話に反映

### 2. visionKnowledge

クライアントのカメラ映像を取得して解析するKnowledgeツール。

```typescript
export const visionKnowledge = createCompanionKnowledge({
  id: "vision-knowledge",
  description: "目で周りを見ます。",
  inputSchema: z.object({}),
  outputSchema: z.string(),
  knowledge: async ({ id, sendQuery, companionAgent }) => {
    const queryId = crypto.randomUUID();
    const query: Query = {
      jsonrpc: "2.0",
      id: queryId,
      method: "query.send",
      params: {
        from: id,
        type: "vision",
      },
    };
    try {
      const result = await sendQuery(query);
      if (!result.result.success) {
        return `視覚情報の取得に失敗しました: ${result.result.error || "不明なエラー"}`;
      }
      if (result.result.body?.image) {
        const res = await companionAgent.agent.generate(
          [
            {
              role: "user" as const,
              content: [
                {
                  type: "image" as const,
                  image: result.result.body.image,
                },
              ],
            },
          ],
          {
            resourceId: "main",
            threadId: "thread",
            instructions:
              "あなたは目で与えられた画像の光景を見ました。自分が見た光景を説明してください。",
            toolChoice: "none",
          },
        );
        return res.text;
      } else {
        return "視覚情報を取得しましたが、データが空でした。";
      }
    } catch (error) {
      return `視覚情報の取得に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`;
    }
  },
});

```

**動作:**

1. `sendQuery`でクライアントに`vision`タイプのQueryを送信
2. クライアントがカメラキャプチャした画像を返す
3. LLMが画像を解析して説明文を生成
4. 説明文を返す（コンパニオンの「視覚」として機能）

## CompanionCardへの登録

作成したKnowledgeツールは、`CompanionCard`の`knowledge`フィールドに登録します。

```typescript
export const companionCard: CompanionCard = {
  metadata: { /* ... */ },
  role: "...",
  actions: { speakTool },
  knowledge: {
    companionNetworkKnowledge,
    visionKnowledge
  },
  events: { /* ... */ }
};
```

LLMは登録されたKnowledgeツールを必要に応じて自動的に実行します。