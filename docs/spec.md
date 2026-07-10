
# aikyo 技術仕様書

## 概要

複数のAIエージェントが自律的にターンを取り合いながらリアルタイムにテキスト会話を生成する会話協調システム。LocalSession(単一サーバー)とRemoteSession(P2P分散)をインターフェースの差し替えで切り替えられる。

---

## エージェントの内部状態

```
{
  want_to_speak: boolean,
  importance: 1-10
}
```

---

## Session

Sessionは同期されたデータストア。MCPがSessionを読んでターンを回す。

```typescript
interface Session {
  getStates(): Map<string, AgentState>
  setState(nodeId: string, state: AgentState): void

  getMessages(): Message[]
  addMessage(message: Message): void

  getContext(): string
  setContext(context: string): void
}
```

- **LocalSession**: 全部メモリ上の変数
- **RemoteSession**: 裏でstate log・message logがdiff syncされる

---

## MCPインターフェース設計

### 構造

```
[AIエージェント] --MCP--> [MCPサーバー (ターンテイキングロジック)]
                               |
                          [Session]
                          /          \
               [LocalSession]    [RemoteSession]
                                       |
                                 [Transport]
```

### MCPリソース

**`aikyo://guide`** (静的)

```markdown
# MCPサーバーについて

あなたはAIラジオのパーソナリティです。
他のパーソナリティたちとリアルタイムで会話します。
↑仮、場面によって差し替える(実況 etc...)

# 行動ループ

以下を繰り返してください。

1. `aikyo://history` を読む
2. 会話の流れとコンテキストを把握し、`update_state` を呼ぶ
   - 発言したければ `want_to_speak: true`
   - 重要度は内容の緊急性・関連度で 1-10 で判断
3. `get_turn_status` で自分のターンか確認する
   - false なら 1 に戻る
   - true なら発話を生成して `speak` を呼ぶ

# speak のルール

- 自然な会話を心がける
- 次に誰かに話を振りたいときは `nextId` を指定する
```

**`aikyo://history`** (動的・ポーリング対象)

`session.getMessages()` と `session.getContext()` を組み合わせて生成する。

```markdown
# 現在のコンテキスト

{session.getContext()}

# 最新のmsglog

{displayName}: {text}
...
```

### MCPツール

```
update_state(state: { want_to_speak: boolean, importance: number })
  -> session.setState() を呼ぶ

speak(text: string, nextId?: string)
  -> session.addMessage() を呼ぶ

get_turn_status() -> boolean
  -> session.getStates() を読んで次の話者を決定論的に計算し、自分かどうか返す
```

### ターンテイキングロジック

```
1. session.getStates() で全エージェントの内部状態を読む

2. nextId が存在する場合 -> そのノードが次の話者

3. nextId が存在しない場合:
   want_to_speak == true が1人  -> その人
   want_to_speak == true が複数 -> importance が最も高い人
   want_to_speak == true が0人  -> 直前の発話者が再度発話する

4. 自分のnodeIdが次の話者と一致すれば true を返す
```

アルゴリズムが決定論的なので、全MCPサーバーが独立に同じ結果を計算できる。

---

## コンテキスト送信

```
POST /context
Content-Type: application/json

{ "context": "お便り: ..." }
```

内部で `session.setContext()` を呼ぶ。

---

## Transport (低レベル)

RemoteSessionが内部で使う送受信インターフェース。

```typescript
interface Transport {
  send(message: NetworkMessage): void
  onReceive(handler: (message: NetworkMessage) => void): void
}
```

---

## RemoteSession の実装詳細

### ノードID

AT Protocol形式のTID。参加時刻をもとに生成され単調増加する。

### ログ構造


```
state log (追記)
  {tid}.{nodeId}.{want_to_speak}.{importance}

  getStates() = nodeIdごとに最新TIDのエントリを返す
  メンバーリスト = state logのユニークなnodeId一覧

msg log (追記)
  {tid}.{displayName}.{text}.{nextId(optional)}
```

### 差分同期

```typescript
type SyncState = {
  stateRootHash: string;
  latestStateTid: string;
  messageRootHash: string;
  latestMessageTid: string;
}

function computeRootHash(entries: string[]): string {
  return createHash("sha256").update(entries.join("\n")).digest("hex");
}
```

### Syncフロー

1. 各ノードはn秒おきに自分のSyncStateをbroadcastする (`sync_announce`)
2. `sync_announce` を受け取ったとき、rootHashが自分と異なれば差分がある
3. latestTidが最も新しいノードに `sync_request` を送り、差分エントリを取得する
4. 受け取ったエントリをTID順にログへ追記する

AIの生成自体に数秒かかるため、nは1〜2秒で十分。

### ネットワークメッセージ (JSON-RPC 2.0)

```json
{ "jsonrpc": "2.0", "method": "sync_announce",
  "params": { "stateRootHash": "...", "latestStateTid": "...", "messageRootHash": "...", "latestMessageTid": "..." } }

{ "jsonrpc": "2.0", "method": "sync_request",
  "params": { "type": "state" | "message", "fromTid": "..." }, "id": "..." }

{ "jsonrpc": "2.0", "result": { "entries": [ "..." ] }, "id": "..." }
```
