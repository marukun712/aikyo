---
title: 移行ガイド v1.5.0
description: aikyoバージョン1.5.0への移行ガイド
---

このガイドでは、aikyo v1.4.x から v1.5.0 へのアップグレード方法について説明します。

## 主な変更点

v1.5.0では、State生成の仕組みが大幅に改善され、より客観的で文脈を考慮した会話制御が可能になりました。

### 1. State生成の分離と改善

#### 変更内容

**以前（v1.4.x）:**
- `CompanionAgent.generateState(message: Message)`が受信したメッセージのみを元に状態を判断

**現在（v1.5.0）:**
- State生成ロジックが`StateJudge`クラスに分離
- 会話履歴全体を参照して状態を判断
- `CompanionAgent.generateState()`は引数なし

#### 影響を受けるコード

**CompanionAgent APIの変更:**

```typescript
// v1.4.x
async generateState(message: Message): Promise<State> { ... }

// v1.5.0
async generateState(): Promise<State> { ... }
```

**移行方法:**

`CompanionAgent.generateState()`を直接呼び出している場合は、引数を削除してください。

```typescript
// v1.4.x
const state = await companionAgent.generateState(message);

// v1.5.0
const state = await companionAgent.generateState();
```

ほとんどの場合、この変更はフレームワーク内部で処理されるため、アプリケーションコードの変更は不要です。

#### 新規プロパティ

`CompanionAgent`に`stateJudge`プロパティが追加されました。

```typescript
stateJudge: StateJudge
```

### 2. Workflowの入力形式変更

#### 変更内容

`generateToolInstruction`のWorkflow入力が会話履歴を含むようになりました。

**以前（v1.4.x）:**
```typescript
const res = await this.run.start({ inputData: input });
```

**現在（v1.5.0）:**
```typescript
const res = await this.run.start({
  inputData: { message: input, history: this.history }
});
```

#### 影響を受けるコード

カスタムWorkflowを実装している場合、入力スキーマを更新する必要があります。

```typescript
// v1.4.x
createWorkflow({
  id: "custom-workflow",
  inputSchema: MessageSchema,
  ...
})

// v1.5.0
createWorkflow({
  id: "custom-workflow",
  inputSchema: z.object({
    message: MessageSchema,
    history: z.array(MessageSchema),
  }),
  ...
})
```

### 3. speakToolのQuery送信機能追加

#### 変更内容

`speakTool`が発言前にクライアントへQueryを送信するようになりました。

**以前（v1.4.x）:**
```typescript
publish: ({ input, id }) => {
  return {
    jsonrpc: "2.0",
    method: "message.send",
    params: { ... }
  };
}
```

**現在（v1.5.0）:**
```typescript
publish: async ({ input, id, sendQuery }) => {
  // クライアントへQuery送信（音声合成など）
  const query: Query = {
    jsonrpc: "2.0",
    id: crypto.randomUUID(),
    method: "query.send",
    params: {
      from: id,
      type: "speak",
      body: { message: input.message, emotion: input.emotion },
    },
  };
  await sendQuery(query);

  // Messageを返す
  return {
    jsonrpc: "2.0",
    method: "message.send",
    params: { ... }
  };
}
```

#### 影響を受けるコード

カスタムActionツールで`publish`関数を使用している場合、`sendQuery`パラメータが利用可能になりました。

**クライアント側の対応:**

`type: "speak"`のQueryを受信した場合、音声合成などの処理を実装できます。

```typescript
ws.on('message', (data) => {
  const message = JSON.parse(data.toString());

  if (message.method === 'query.send' && message.params.type === 'speak') {
    // 音声合成処理
    synthesizeSpeech(message.params.body.message, message.params.body.emotion);

    // QueryResultを返す
    ws.send(JSON.stringify({
      jsonrpc: '2.0',
      id: message.id,
      result: { success: true, body: {} }
    }));
  }
});
```

### 4. Zodスキーマの厳格化

#### 変更内容

すべてのZodスキーマに`.strict()`が適用され、未定義のフィールドを許容しなくなりました。

**影響を受けるスキーマ:**
- `StateBodySchema`
- `MessageSchema`
- `QuerySchema`
- `QueryResultSchema`
- `ActionSchema`
- その他すべてのスキーマ

#### StateBodyスキーマの変更

`id`フィールドが削除されました。

**以前（v1.4.x）:**
```typescript
export const StateBody = z.object({
  id: z.string(),
  from: z.string(),
  messageId: z.string(),
  // ...
});
```

**現在（v1.5.0）:**
```typescript
export const StateBodySchema = z.object({
  from: z.string(),
  messageId: z.string(),
  // ...
}).strict();
export type StateBody = z.infer<typeof StateBodySchema>;
```

#### 移行方法

State型のデータを手動で作成している場合、`id`フィールドを削除してください。

```typescript
// v1.4.x
const state: State = {
  jsonrpc: "2.0",
  method: "state.send",
  params: {
    id: "...",  // 削除
    from: "...",
    messageId: "...",
    // ...
  }
};

// v1.5.0
const state: State = {
  jsonrpc: "2.0",
  method: "state.send",
  params: {
    from: "...",
    messageId: "...",
    // ...
  }
};
```

## アップグレード手順

1. **依存関係の更新:**

```bash
pnpm update @aikyo/server @aikyo/firehose @aikyo/utils
```

2. **カスタムコードの確認:**
   - `generateState(message)`呼び出しがあれば引数を削除
   - カスタムWorkflowの入力スキーマを更新
   - `StateBody`に`id`フィールドを含めている場合は削除

3. **クライアント実装の更新（オプション）:**
   - `type: "speak"`のQueryハンドラーを実装して音声合成機能を追加

## 互換性

- **破壊的変更:** `CompanionAgent.generateState()`のシグネチャ変更、`StateBody`スキーマ変更
- **後方互換性:** 基本的なコンパニオン実装には影響なし（フレームワークが内部で処理）
- **推奨アクション:** カスタム実装がある場合は上記の移行手順を確認

## 関連リンク

- [ターンテイキング](./core/turn-taking)
- [CompanionAgent API](./api/companion-agent)
- [Action（行動ツール）](./tools/action)
