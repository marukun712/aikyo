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

**引数:**

- `query`: 送信するQuery
- `timeout`: タイムアウト時間（ミリ秒、デフォルト30000）

**戻り値:**

- `Promise<QueryResult>`: クライアントからのレスポンス

### タイムアウト処理

クライアントからのレスポンスが`timeout`時間内に到着しない場合、Promiseはrejectされます。

## pendingQueries管理

`CompanionServer`は`pendingQueries` Mapでクエリの待機状態を管理します。

**QueryResult受信時の処理:**

1. `queries`トピックでQueryResultを受信
2. `pendingQueries`から対応するクエリを検索
3. `resolve`を呼び出してPromiseを完了
4. `pendingQueries`から削除
