---
title: データタイプ
description: aikyoのP2Pネットワークで利用される主要なデータタイプの仕様
---

## データタイプ概要

aikyoでは、P2Pネットワーク上で複数のデータタイプがやりとりされます。それぞれが異なる役割を担っています。

- **Message**: 会話の基本的なメッセージ
- **Action**: コンパニオンの行動やジェスチャー
- **State**: 会話のターンを制御するための状態表明
- **Query / QueryResult**: コンパニオン間の情報照会と結果

各データタイプは、対応するトピックで送受信されます。

## Message

### トピック

`messages`

### 用途

- コンパニオン間のテキストベースの会話
- ユーザーとコンパニオンのやりとり

### スキーマ

```typescript
const MessageSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.array(z.string()),
  message: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
});
```

#### フィールド詳細

- `id: string`: メッセージの一意なID（UUIDなど）
- `from: string`: 送信者のID (`companion_*` または `user_*`)
- `to: string[]`: 宛先のIDの配列。複数の宛先を指定可能。
- `message: string`: メッセージ本文
- `metadata?: Record<string, any>`: 感情などの追加情報

### 使用例

```json
{
  "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "from": "user_alice",
  "to": ["companion_bob"],
  "message": "こんにちは！元気ですか？",
  "metadata": {
    "emotion": "happy"
  }
}
```

## Action

### トピック

`actions`

### 用途

- コンパニオンの身体的動作（ジェスチャー、アニメーション）
- クライアント側で解釈・実行されるべき行動の指示

### スキーマ

```typescript
const ActionSchema = z.object({
  from: z.string(),
  name: z.string(),
  params: z.record(z.string(), z.any()),
  metadata: z.record(z.string(), z.any()).optional(),
});
```

#### フィールド詳細

- `from: string`: アクションを実行するコンパニオンのID
- `name: string`: アクションの種類（例: `"gesture"`, `"move"`）
- `params: Record<string, any>`: アクション固有のパラメータ
- `metadata?: Record<string, any>`: タイムスタンプなどの追加情報

### 使用例

```json
{
  "from": "companion_bob",
  "name": "gesture",
  "params": {
    "type": "wave"
  }
}
```

## State

### トピック

`states`

### 用途

会話のターンテイキング（発話権の調整）とクロージング（会話の収束）を管理するための、フレームワークの中核となるデータタイプです。あるメッセージを受け取った各コンパニオンは、自身の次の行動意思をこの`State`データとして表明します。

### スキーマ

```typescript
const StateSchema = z.object({
  from: z.string(),
  messageId: z.string().describe("このstateが対応する元のメッセージのID"),
  state: z
    .enum(["speak", "listen"])
    .describe("次に発言をしたいか、聞く姿勢に入りたいか"),
  importance: z
    .number()
    .min(0)
    .max(10)
    .describe("会話の文脈におけるあなたが次にしたい発言の重要度"),
  selected: z
    .boolean()
    .describe("前回の発言者の発言で、あなたに発言を求められているかどうか"),
  closing: z
    .enum(["none", "pre-closing", "closing", "terminal"])
    .default("none")
    .describe("会話の収束段階"),
});
```

### フィールド詳細

- `from: string`: この`State`を表明しているコンパニオンのID。
- `messageId: string`: この`State`が、どの`Message`に対する反応であるかを示すID。
- `state: "speak" | "listen"`:
  - `speak`: 次のターンで発言したいという意思表示。
  - `listen`: 次のターンは聞き役に回るという意思表示。
- `importance: number`: `state`が`speak`の場合に、その発言がどれだけ重要かを0から10の数値で示します。`TurnTakingManager`は、この値が最も高いコンパニオンに次の発言権を与えます。
- `selected: boolean`: 元のメッセージで、自分が名指しで返信を求められている（`to`に含まれている）かどうかを示します。`true`の場合、発言権を得やすくなります。
- `closing: "none" | "pre-closing" | "closing" | "terminal"`: 会話の収束段階を示します。
  - `none`: 会話は継続中。
  - `pre-closing`: 会話を終えようとする最初の兆候。
  - `closing`: 明確な会話終了の意思表示。
  - `terminal`: 全員が会話終了に合意した最終状態。

## Query / QueryResult

### トピック

`queries`, `query-results`

### 用途

- コンパニオンがクライアントアプリケーションに問い合わせを行い(例:カメラ画像の取得)、その結果を受け取るために使用します。

### Query スキーマ

```typescript
const QuerySchema = z.object({
  id: z.string(), // クエリの一意なID
  from: z.string(),
  type: z.string(), // クエリの種類
});
```

### QueryResult スキーマ

```typescript
const QueryResultSchema = z.object({
  id: z.string(), // 対応するクエリのID
  success: z.boolean(),
  body: z.string().optional(),
  error: z.string().optional(),
});
```
