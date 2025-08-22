---
title: メッセージタイプ
description: aikyoで使用される3種類のメッセージタイプの詳細仕様
---

## メッセージタイプ概要

aikyoでは、P2Pネットワーク上で3種類のメッセージをやりとりします。

- **Message** - コンパニオン間、または人間とのメッセージ交換
- **Action** - コンパニオンの物理的動作表現
- **Context** - 共有状況情報

各メッセージタイプは専用のトピックで配信され、異なる目的と構造を持ちます。

## Message（メッセージ）

### トピック

`messages`

### 用途

- コンパニオン間のテキストベース会話
- 人間とコンパニオンのやりとり
- 返答が必要な質問や依頼

### スキーマ

```typescript
interface Message {
  from: string; // 送信者ID
  message: string; // メッセージ内容
  target?: string; // 受信者ID（オプション）
  metadata?: Record<string, any>; // 追加メタデータ
}
```

#### フィールド詳細

##### `from: string`

- **必須**: はい
- **形式**: `companion_*` または `user_*`
- **例**: `"companion_bebf00bb-8a43-488d-9c23-93c40b84d30e"`, `"user_alice"`
- **説明**: メッセージ送信者の識別子

##### `message: string`

- **必須**: はい
- **例**: `"こんにちは！今日はいい天気ですね"`
- **説明**: 送信するテキストメッセージ

##### `target?: string`

- **必須**: いいえ
- **形式**: `companion_*` または `user_*`
- **例**: `"companion_12345678-abcd-1234-abcd-123456789abc"`
- **説明**: 特定の受信者を指定。未指定の場合は独り言として処理。

##### `metadata?: Record<string, any>`

- **必須**: いいえ
- **例**: `{ "emotion": "happy"}`
- **説明**: 感情などの追加情報

### 使用例

#### 基本的なメッセージ

```json
{
  "from": "companion_bebf00bb-8a43-488d-9c23-93c40b84d30e",
  "message": "おはようございます！今日も元気に頑張りましょう！",
  "metadata": {
    "emotion": "happy"
  }
}
```

#### 特定ユーザーへの返答

```json
{
  "from": "companion_bebf00bb-8a43-488d-9c23-93c40b84d30e",
  "message": "はい、喜んでお手伝いします！",
  "target": "user_alice"
}
```

#### コンパニオン間の相談

```json
{
  "from": "companion_a",
  "message": "この状況をどう対応すべきか相談があります",
  "target": "companion_b"
}
```

## Action（アクション）

### トピック

`actions`

### 用途

- コンパニオンの身体的動作表現
- ジェスチャーやアニメーション

### スキーマ

```typescript
interface Action {
  from: string; // 送信者ID（コンパニオンのみ）
  name: string; // アクション名
  params: Record<string, any>; // アクションパラメータ
  metadata?: Record<string, any>; // 追加メタデータ
}
```

#### フィールド詳細

##### `from: string`

- **必須**: はい
- **形式**: `companion_*` のみ
- **説明**: アクションを実行するコンパニオンのID

##### `name: string`

- **必須**: はい
- **例**: `"gesture"`, `"move"`, `"expression"`
- **説明**: 実行するアクションの種類

##### `params: Record<string, any>`

- **必須**: はい
- **説明**: アクション固有のパラメータ

##### `metadata?: Record<string, any>`

- **必須**: いいえ
- **説明**: 実行コンテキストやタイムスタンプなどの追加情報

### 使用例

#### ジェスチャーアクション

```json
{
  "from": "companion_bebf00bb-8a43-488d-9c23-93c40b84d30e",
  "name": "gesture",
  "params": {
    "type": "wave",
    "intensity": "normal",
    "direction": "forward"
  }
}
```

#### 移動アクション

```json
{
  "from": "companion_bebf00bb-8a43-488d-9c23-93c40b84d30e",
  "name": "move",
  "params": {
    "x": "0",
    "y": "100",
    "z": "0"
  }
}
```

#### 表情変更アクション

```json
{
  "from": "companion_bebf00bb-8a43-488d-9c23-93c40b84d30e",
  "name": "expression",
  "params": {
    "emotion": "surprised"
  }
}
```

## Context（コンテキスト）

### トピック

`contexts`

### 用途

- 環境変化の共有
- 重要な状況変化の通知
- コンパニオン間の情報同期

### スキーマ

```typescript
interface Context {
  type: "text" | "image"; // コンテキストタイプ
  context: string; // コンテキスト内容
}
```

#### フィールド詳細

##### `type: string`

- **必須**: はい
- **形式**: `"text"`, `"image"`,
- **説明**: コンテキスト情報の種類

##### `context: string`

- **必須**: はい
- **説明**: typeがtextの場合はテキスト、imageの場合はbase64エンコードされた画像

### 使用例

#### 環境変化の通知

```json
{
  "type": "text",
  "context": "部屋の明かりが暗くなりました"
}
```

#### 新しい人の到着

```json
{
  "type": "text",
  "context": "新しい訪問者が玄関に到着しました"
}
```

#### カメラ映像の配信

```json
{
  "type": "image",
  "context": "base64_encoded_image"
}
```
