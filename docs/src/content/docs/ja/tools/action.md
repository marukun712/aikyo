---
title: Action（行動ツール）
description: aikyoのAction（行動ツール）の詳細とAPI仕様
---

**Action**は、AIコンパニオンに「体」を与えるためのツールです。P2Pネットワークやクライアントに対してメッセージやアクションを送信し、外部環境に働きかけることができます。

## Actionの特徴

- **クライアントへの通知**: P2Pネットワークへのメッセージ送信やクライアントへの通知など、外部への影響を持つ
- **宣言的な実行**: CEL式による宣言的なツール実行の定義

## createCompanionAction API

`createCompanionAction`関数を使用してActionツールを作成します。

```typescript
export function createCompanionAction<T extends ZodTypeAny>({
  id,
  description,
  inputSchema,
  topic,
  publish,
}: CompanionActionConfig<T>)
```

### パラメータ

#### CompanionActionConfig

```typescript
export interface CompanionActionConfig<T extends z.ZodSchema> {
  id: string;
  description: string;
  inputSchema: T;
  topic: "actions" | "messages";
  publish: (props: {
    input: z.infer<T>;
    id: string;
    companions: Map<string, string>;
    sendQuery: (query: Query) => Promise<QueryResult>;
    companionAgent: CompanionAgent;
  }) => Promise<Output> | Output;
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `id` | `string` | ツールの一意なID |
| `description` | `string` | ツールの説明（LLMがツール選択時に参照） |
| `inputSchema` | `ZodTypeAny` | 入力スキーマ（Zodスキーマ） |
| `topic` | `"actions"` \| `"messages"` | パブリッシュ先トピック |
| `publish` | `function` | メッセージ生成関数 |

#### publish関数のprops

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `input` | `z.infer<T>` | inputSchemaで定義された入力データ |
| `id` | `string` | コンパニオンのID |
| `companions` | `Map<string, string>` | 接続中のコンパニオンリスト |
| `sendQuery` | `function` | クライアントへQueryを送信する関数 |
| `companionAgent` | `CompanionAgent` | コンパニオンエージェントのインスタンス |

#### 戻り値（Output型）

```typescript
type Output = Action | Message;
```

- **Message**: コンパニオン間の会話メッセージ
- **Action**: クライアント向けのアクション通知

## 実装例

### speakTool（会話メッセージ送信）

最も基本的なActionツールで、コンパニオン間の会話メッセージを送信します。

```typescript
import { randomUUID } from "node:crypto";

export const speakTool = createCompanionAction({
  id: "speak",
  description: "発言する。",
  inputSchema: z.object({
    message: z.string(),
    to: z
      .array(z.string())
      .describe(
        "このメッセージの宛先。必ずコンパニオンのidを指定してください。特定のコンパニオンに個人的に話しかけたいとき以外は、必ず、会話に参加したことのある全員を含むようにしてください。また、積極的にuserに会話を振ってください。",
      ),
    emotion: z.enum(["happy", "sad", "angry", "neutral"]),
  }),
  topic: "messages",
  publish: async ({ input, id, sendQuery }) => {
    const queryId = randomUUID();
    const query: Query = {
      jsonrpc: "2.0",
      id: queryId,
      method: "query.send",
      params: {
        from: id,
        type: "speak",
        body: { message: input.message, emotion: input.emotion },
      },
    };
    await sendQuery(query);
    return {
      jsonrpc: "2.0",
      method: "message.send",
      params: {
        id: randomUUID(),
        from: id,
        to: input.to,
        message: input.message,
        metadata: { emotion: input.emotion },
      },
    };
  },
});
```

**動作:**

1. 入力から`message`, `to`, `emotion`を取得
2. `type: "speak"`のQueryを生成してクライアントに送信（音声合成などに使用）
3. `Message`型のデータを生成
4. `messages`トピックにpublish

## CompanionCardへの登録

作成したActionツールは、`CompanionCard`の`actions`フィールドに登録します。

```typescript
export const companionCard: CompanionCard = {
  metadata: { /* ... */ },
  role: "...",
  actions: {
    speakTool,
    lightControlAction
  },
  knowledge: { /* ... */ },
  events: { /* ... */ }
};
```
