---
title: Query（クエリシステム）
description: aikyoのクライアント⇔コンパニオン双方向通信システム
---

**Query**は、コンパニオンとクライアント間で双方向通信を行うための仕組みです。コンパニオンからクライアントに情報を要求し、結果を受け取ることができます。

## Queryの特徴

- **双方向通信**: コンパニオン→クライアント→コンパニオンの往復通信
- **非同期処理**: Promiseベースで結果を待機
- **タイムアウト機能**: 応答がない場合は自動的にタイムアウト
- **柔軟なデータ**: 任意のJSON形式でリクエスト・レスポンスを送受信

## Query型とQueryResult型

### Query型

```typescript
export const QuerySchema = z.object({
  jsonrpc: z.literal("2.0"),
  method: z.literal("query.send"),
  id: z.string(),
  params: z.object({
    from: z.string(),
    type: z.string(),
    body: z.record(z.string(), z.any()).optional(),
  }),
});
export type Query = z.infer<typeof QuerySchema>;
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `jsonrpc` | `"2.0"` | JSON-RPCバージョン |
| `method` | `"query.send"` | メソッド名 |
| `id` | `string` | クエリの一意なID（レスポンスと紐付け） |
| `params.from` | `string` | 送信元コンパニオンのID |
| `params.type` | `string` | クエリのタイプ（例: `"vision"`, `"speak"`) |
| `params.body` | `object` | 追加データ（オプション） |

### QueryResult型

```typescript
export const QueryResultSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.string(),
  result: z
    .object({
      success: z.boolean(),
      body: z.record(z.string(), z.any()),
    })
    .optional(),
  error: z.string().optional().describe("エラーメッセージ"),
});
export type QueryResult = z.infer<typeof QueryResultSchema>;
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `jsonrpc` | `"2.0"` | JSON-RPCバージョン |
| `id` | `string` | クエリのID（Queryと一致） |
| `result` | `object` | 成功時のレスポンス（オプション） |
| `result.success` | `boolean` | 成功/失敗フラグ |
| `result.body` | `object` | レスポンスデータ |
| `error` | `string` | エラー時のメッセージ（オプション） |

## sendQuery関数

`sendQuery`は、Queryを送信してQueryResultを待機する関数です。

```typescript
export const sendQuery =
  (
    libp2p: Libp2p<Services>,
    pendingQueries: Map<
      string,
      {
        resolve: (value: QueryResult) => void;
        reject: (reason: string) => void;
      }
    >,
  ) =>
  async (query: Query, timeout?: number) => {
    const resultPromise = new Promise<QueryResult>((resolve, reject) => {
      setTimeout(
        () => {
          pendingQueries.delete(query.id);
          reject(new Error(`Error:クエリがタイムアウトしました。`));
        },
        timeout ? timeout : 30000, // デフォルト30秒
      );
      pendingQueries.set(query.id, {
        resolve,
        reject,
      });
    });
    // queriesトピックにパブリッシュ
    libp2p.services.pubsub.publish(
      "queries",
      new TextEncoder().encode(JSON.stringify(query)),
    );

    return resultPromise;
  };
```

**引数:**

- `query`: 送信するQuery
- `timeout`: タイムアウト時間（ミリ秒、デフォルト30000）

**戻り値:**

- `Promise<QueryResult>`: クライアントからのレスポンス

### タイムアウト処理

クライアントからのレスポンスが`timeout`時間内に到着しない場合、Promiseはrejectされます。

```typescript
setTimeout(
  () => {
    pendingQueries.delete(query.id);
    reject(new Error(`Error:クエリがタイムアウトしました。`));
  },
  timeout ? timeout : 30000,
);
```

## pendingQueries管理

`CompanionServer`は`pendingQueries` Mapでクエリの待機状態を管理します。

```typescript
pendingQueries = new Map<
  string,
  {
    resolve: (value: QueryResult) => void;
    reject: (reason: string) => void;
  }
>();
```

**QueryResult受信時の処理:**

```typescript
if (topic === "queries") {
  const parsed = QueryResultSchema.safeParse(data);
  if (parsed.success) {
    const queryResult = parsed.data;
    const pending = server.pendingQueries.get(queryResult.id);
    if (pending) {
      pending.resolve(queryResult);
      server.pendingQueries.delete(queryResult.id);
    }
  }
}
```

1. `queries`トピックでQueryResultを受信
2. `pendingQueries`から対応するクエリを検索
3. `resolve`を呼び出してPromiseを完了
4. `pendingQueries`から削除

## 実装例

### 1. visionKnowledgeでのQuery使用

カメラ映像を取得するクエリ例:

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
      if (!result.result) {
        return `視覚情報の取得に失敗しました: ${result.error || "不明なエラー"}`;
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

1. `type: "vision"`のQueryを生成
2. `sendQuery`でクライアントに送信
3. クライアントがカメラキャプチャしてbase64画像を返す
4. 画像をLLMで解析して説明文を生成

### 2. speakToolでのQuery使用

音声合成をクライアントに依頼する例:

```typescript
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
    const queryId = crypto.randomUUID();
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
    const res = await sendQuery(query);
    console.log(res);
    return {
      jsonrpc: "2.0",
      method: "message.send",
      params: {
        id: crypto.randomUUID(),
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

1. `type: "speak"`のQueryを生成
2. `body`にメッセージと感情を含める
3. クライアントが音声合成を実行
4. Messageをパブリッシュ

## クライアント側の実装例

WebSocketクライアントでのQuery処理例:

```typescript
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:8080');

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());

  if (message.method === 'query.send') {
    const query = message;
    let result: QueryResult;
    // typeに応じて処理を実行
    if (query.params.type === 'vision') {
      // カメラキャプチャ
      const image = captureCamera(); // 仮想関数
      result = {
        jsonrpc: '2.0',
        id: query.id,
        result: {
          success: true,
          body: { image: image }
        }
      };
    } else if (query.params.type === 'speak') {
      // 音声合成
      const tts = synthesizeSpeech(query.params.body.message);
      result = {
        jsonrpc: '2.0',
        id: query.id,
        result: {
          success: true,
          body: {}
        }
      };
    } else {
      result = {
        jsonrpc: '2.0',
        id: query.id,
        error: `未対応のクエリタイプ: ${query.params.type}`
      };
    }
    ws.send(JSON.stringify(result));
  }
});
```

**ポイント:**

- `query.id`を使ってQueryResultに同じIDを設定
- `type`フィールドで処理を振り分け
- 成功時は`result: { success: true, body: {...} }`を返す
- エラー時は`result`を省略し、`error`フィールドにメッセージを設定
