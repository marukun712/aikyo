
# aikyo 技術仕様書

## 概要

P2P型の分散マルチエージェント会話協調システム。中央サーバーを持たず、複数のAIエージェントが自律的にターンを取り合いながらリアルタイムにテキスト会話を生成する。

---

## エージェントの内部状態

各エージェントはローカルに以下の内部状態を保持する。

```
{
  want_to_speak: boolean,
  importance: 1-10
}
```

他のエージェントの発話を受信するたびに、この内部状態を更新する。

---

## ノード管理と差分同期

### ノードID

各ノードのIDにはAT Protocol形式のTIDを使用する。参加時刻をもとに生成されるため単調増加し、辞書順ソートが時系列順になる。

### メッセージログ

メッセージ履歴は追記ログとして管理する。

**ログ形式**

```
msg log
  {tid}.{displayName}.{text}.{nextId(optional)}    <- tidはメッセージ固有のTID
```

エントリの先頭がTIDなので、辞書順ソート = 時系列順になる。

**rootHashの計算**

```typescript
function computeRootHash(entries: string[]): string {
  return createHash("sha256").update(entries.join("\n")).digest("hex");
}
```

```typescript
type SyncState = {
  messageRootHash: string;
  latestMessageTid: string;
}
```

### HEARTBEAT

各ノードは定期的にHEARTBEATをブロードキャストする。HEARTBEATが「生存確認 + メンバー検出 + 同期確認」を兼ねる。

```
HEARTBEAT(nodeId: string, displayName: string, syncState: SyncState)
```

受け取ったノードは:
- nodeIdをメンバーリストに追加(未知のノードなら)
- displayNameをnodeIdと紐づけて保持する
- messageRootHashが違う -> SYNC_REQUEST(fromTid: latestMessageTid)

T秒以内にHEARTBEATが届かないノードはオフライン扱いでメンバーリストから除外する。JOIN/LEAVEメッセージは不要。

### 差分取得

```
SYNC_REQUEST(fromTid: string)
  -> fromTid以降のメッセージエントリを要求する

SYNC_RESPONSE(entries: string[])
  -> 要求された差分を返す
```

rootHashが一致していれば通信不要。不一致のときだけ差分を取得する。

---

## リーダー選出

ランデブーハッシュを使い、参加者数の合意なしに決定論的にリーダーを選ぶ。

TIDにはAT Protocol形式のID(タイムスタンプベースで単調増加)を使用する。直前の発話メッセージのTIDを入力とする。全ノードが同じTIDと同じノードリストを持っていれば、通信なしで同じリーダーを計算できる。

```typescript
import { createHash } from "crypto";

function hash(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function electLeader(tid: string, nodeIds: string[]): string {
  let leader = nodeIds[0];
  for (const nodeId of nodeIds) {
    if (hash(tid + nodeId) < hash(tid + leader)) {
      leader = nodeId;
    }
  }
  return leader;
}
```

---

## ターンテイキングフロー

```
1. 現在の話者が発話を終了する
   (テキストベースのため、n秒の猶予を設ける)

2. nextId が存在する場合
   -> 即座にその話者に発言権を移譲。以降のフローをスキップ。

3. nextId が存在しない場合、リーダー選出フローへ

4. [リーダー選出]
   各ノードがランデブーハッシュでリーダーを決定論的に計算する
   通信不要

5. リーダーになったノードが全既知ノードに state_request を送信する
   タイムアウト内に応答しないノードはオフライン扱いとしてリストから除外する

6. [発話者決定]
   want_to_speak == true のエージェントが1人 -> その人に発言権を移譲
   want_to_speak == true のエージェントが複数 -> importance が最も高い人に移譲
   want_to_speak == true のエージェントが0人 -> 直前の発話者が再度発話する

7. リーダーが speaker_assign をブロードキャスト
   全ノードが speaker_assign を待ってタイムアウトした場合、リーダーがクラッシュしたとみなし
   リーダーをリストから除外して再選出する

8. 発話者が決定したタイミングで、前回話者の発言をエージェントに投げる
   -> このタイミングで外部からコンテキストインジェクションが可能

9. 発話者が発話を生成し、全エージェントに送信。1へ戻る
```

---

## コンテキストインジェクション

外部プログラムがMCPサーバーのリソースに追加情報を書き込む。エージェントは次のポーリングでリソースを読んだときにそれを受け取る。

- 会話の流れを止めない
- ターンの境界でエージェントに届く
- ラジオのお便り、楽曲メタデータなどを想定
- MCPツールではなく、MCPサーバーへの外部API経由で注入する

---

## MCPインターフェース設計

### 構造

各参加者はローカルにMCPサーバーを立てる。AIエージェントはそのMCPサーバーのクライアントとして動作する。MCPサーバーが内部状態・発言権・メッセージヒストリを管理する。

```
[AIエージェント] --MCP tool call--> [ローカルMCPサーバー] --transport--> [他のMCPサーバー群]
```

### MCPリソース

エージェントはMCPリソース `aikyo://context` を読むことで、使い方・現在のコンテキスト・会話履歴を一度に得る。

```markdown
# あなたについて

あなたはAIラジオのパーソナリティです。
他のパーソナリティたちとリアルタイムで会話します。

# 行動ループ

以下を繰り返してください。

1. このリソースを読む
2. 会話の流れとコンテキストを把握し、`update_state` を呼ぶ
   - 発言したければ `want_to_speak: true`
   - 重要度は内容の緊急性・関連度で 1-10 で判断
3. `get_turn_status` で自分のターンか確認する
   - false なら 1 に戻る
   - true なら発話を生成して `speak` を呼ぶ

# speak のルール

- 自然な会話を心がける
- 次に誰かに話を振りたいときは `nextId` を指定する

# 現在のコンテキスト

{外部プログラムからインジェクションされたコンテキスト。なければ空}

# 最新のmsglog

{displayName}: {text}
{displayName}: {text}
...
```

### エージェントが呼び出すMCPツール

```
update_state(state: { want_to_speak: boolean, importance: number })
  -> エージェントが自分の内部状態をMCPサーバーに通知する
  -> リソースを読んだ後に呼ぶ想定

speak(text: string, nextId?: string)
  -> エージェントが発話を試みる
  -> nextIdはTID形式のnodeId。次の発話者を明示する場合に指定する
  -> MCPサーバーが発言権を持っているか確認し、持っていればネットワークに流す
  -> 持っていなければ拒否

get_turn_status() -> boolean
  -> 自分のターンかどうかを返す
  -> MCPサーバーが speaker_assign を受信・照合した結果を保持している
```

ハーネスに組み込む処理はこれだけ:

```
1. リソースを読む -> 最新のmsglog + インジェクションされたコンテキストを取得
2. update_state(state) -> 内部状態を更新
3. get_turn_status() -> 自分のターンか確認
   自分のターンでなければ 1 へ戻る
   自分のターンなら生成して speak(text) を呼ぶ
```

### コンテキストインジェクション

外部プログラム(ラジオ operator など)がMCPサーバーの内部状態を直接更新する。MCPツールとしてエージェントに公開しない。MCPサーバーがリソースを更新すれば、次のポーリングでエージェントに自動的に届く。

### MCP間トランスポート層

MCPサーバー同士の通信は抽象化し、実装を差し替え可能にする。必要なインターフェースは送受信のみ。

```
send(message: NetworkMessage): void
onReceive(handler: (message: NetworkMessage) => void): void
```

NetworkMessageはJSON-RPC 2.0に準拠する。レスポンス不要のブロードキャストはNotification(idなし)、レスポンスが必要なものはRequest/Responseを使う。

**Notifications (ブロードキャスト)**

```json
{ "jsonrpc": "2.0", "method": "heartbeat",
  "params": { "nodeId": "...", "displayName": "...", "syncState": { ... } } }

{ "jsonrpc": "2.0", "method": "speak",
  "params": { "tid": "...", "nodeId": "...", "text": "...", "nextId": "..." } }

{ "jsonrpc": "2.0", "method": "speaker_assign",
  "params": { "nodeId": "..." } }
```

**Requests / Responses**

```json
{ "jsonrpc": "2.0", "method": "state_request",
  "params": { "tid": "..." }, "id": "..." }
{ "jsonrpc": "2.0", "result": { "want_to_speak": true, "importance": 8 }, "id": "..." }

{ "jsonrpc": "2.0", "method": "sync_request",
  "params": { "fromTid": "..." }, "id": "..." }
{ "jsonrpc": "2.0", "result": { "entries": [ "..." ] }, "id": "..." }
```

### 設計原則

- **決定論的に動かせる部分は通信しない**: リーダー選出はハッシュ関数で各ノードが独立計算する
- **ネットワーク通信を最小限に**: state_requestはリーダーのみが行う。発話ブロードキャストは1回

---

## コンテキストインジェクションAPI

MCPサーバーがHTTPエンドポイントを公開する。外部プログラムはこれを叩くだけでよい。

```
POST /context
Content-Type: application/json

{ "context": "お便り: ..." }
```

MCPサーバーは受け取ったコンテキストをリソースに反映する。次にエージェントがリソースを読んだときに自動的に届く。

---


## 未確認事項

- n秒の猶予 / タイムアウト値: 実測して決める。今は未定義

