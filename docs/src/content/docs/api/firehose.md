---
title: Firehose
description: FirehoseクラスのAPIリファレンス
---

`Firehose`は、WebSocketクライアントとlibp2p Pubsubをブリッジするサーバーです。ブラウザやNode.jsクライアントがP2Pネットワークに参加できるようにします。

## インポート

```typescript
import { Firehose } from "@aikyo/firehose";
```

## コンストラクタ

```typescript
constructor(port: number, libp2pConfig?: Libp2pOptions<Services>)
```

### パラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `port` | `number` | WebSocketサーバーのポート番号 |
| `libp2pConfig` | `Libp2pOptions<Services>` | オプション。libp2pノードのカスタム設定 |

### 使用例

```typescript
import { Firehose } from "@aikyo/firehose";

// 基本的な使用（デフォルト設定）
const firehose = new Firehose(8080);
await firehose.start();
```

カスタムlibp2p設定を使用する場合は、完全な設定を提供する必要があります：

```typescript
import { Firehose } from "@aikyo/firehose";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import { mdns } from "@libp2p/mdns";
import { tcp } from "@libp2p/tcp";

const customFirehose = new Firehose(8080, {
  addresses: { listen: ["/ip4/0.0.0.0/tcp/9000"] },
  transports: [tcp()],
  peerDiscovery: [mdns()],
  connectionEncrypters: [noise()],
  streamMuxers: [yamux()],
  services: {
    pubsub: gossipsub({ allowPublishToZeroTopicPeers: true }),
    identify: identify(),
  },
});
await customFirehose.start();
```

## プロパティ

### libp2p

```typescript
private libp2p: Libp2p<Services>
```

libp2pノードのインスタンス（CompanionServerと同じ構成）。

```typescript
this.libp2p = await createLibp2p({
  addresses: {
    listen: ["/ip4/0.0.0.0/tcp/0"],
  },
  transports: [tcp()],
  peerDiscovery: [mdns()],
  connectionEncrypters: [noise()],
  streamMuxers: [yamux()],
  services: {
    pubsub: gossipsub({ allowPublishToZeroTopicPeers: true }),
    identify: identify(),
  },
});
```

### wss

```typescript
private wss: WebSocketServer
```

WebSocketサーバーのインスタンス。

```typescript
this.wss = new WebSocketServer({ port: this.port });
```

### clients

```typescript
private clients: Set<WebSocket>
```

接続中のWebSocketクライアントを管理するSet。

```typescript
this.clients = new Set();
```

新しいクライアントが接続すると追加され、切断時に削除されます。

### port

```typescript
private readonly port: number
```

WebSocketサーバーのポート番号。

### topicHandlers

```typescript
private topicHandlers: {
  [K in keyof TopicPayloads]: ((data: TopicPayloads[K]) => void)[];
}
```

トピックごとのハンドラー関数を管理するオブジェクト。型安全なイベント処理を提供します。

```typescript
type TopicPayloads = {
  messages: Message;
  queries: Query | QueryResult;
  actions: Action;
  states: State;
};
```

各トピックに対して複数のハンドラーを登録でき、メッセージ受信時に順次実行されます。

### libp2pConfig

```typescript
private libp2pConfig?: Libp2pOptions<Services>
```

オプション。libp2pノードのカスタム設定。指定しない場合はデフォルト設定が使用されます。

## メソッド

### start()

Firehoseサーバーを起動します。

```typescript
async start(): Promise<void>
```

**処理フロー:**

1. libp2pノードを初期化
2. WebSocketサーバーを起動
3. イベントリスナーを登録

**出力例:**

```
aikyo firehose server running on ws://localhost:8080
```

### subscribe()

指定したトピックをサブスクライブし、オプションでハンドラーを登録します。

```typescript
async subscribe<K extends keyof TopicPayloads>(
  topic: K,
  handler?: (data: TopicPayloads[K]) => void
): Promise<void>
```

**パラメータ:**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `topic` | `keyof TopicPayloads` | サブスクライブするトピック名（`"messages"`, `"queries"`, `"actions"`, `"states"`） |
| `handler` | `function` | オプション。メッセージ受信時に実行するハンドラー関数 |

**使用例:**

```typescript
// トピックのサブスクライブのみ
await firehose.subscribe("messages");

// ハンドラー付きでサブスクライブ
await firehose.subscribe("messages", (data) => {
  console.log("Message received:", data);
  firehose.broadcastToClients(data);
});
```

### addHandler()

既存のトピックにハンドラーを追加します。

```typescript
addHandler<K extends keyof TopicPayloads>(
  topic: K,
  handler: (data: TopicPayloads[K]) => void
): void
```

**パラメータ:**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `topic` | `keyof TopicPayloads` | トピック名 |
| `handler` | `function` | メッセージ受信時に実行するハンドラー関数 |

**使用例:**

```typescript
firehose.addHandler("actions", (action) => {
  console.log("Action received:", action);
});
```

### broadcastToClients()

接続中の全WebSocketクライアントにデータをブロードキャストします。

```typescript
broadcastToClients(data: unknown): void
```

**パラメータ:**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `data` | `unknown` | ブロードキャストするデータ（JSON.stringifyされます） |

**使用例:**

```typescript
firehose.broadcastToClients({
  type: "notification",
  message: "Hello, clients!"
});
```

## 完全な使用例

`scripts/firehose.ts`の実装例：

```typescript
import { Firehose } from "@aikyo/firehose";

const firehose = new Firehose(8080);
await firehose.start();

// messagesトピックをサブスクライブし、クライアントにブロードキャスト
await firehose.subscribe("messages", (data) => {
  firehose.broadcastToClients(data);
});

// queriesトピックをサブスクライブし、クライアントにブロードキャスト
await firehose.subscribe("queries", (data) => {
  firehose.broadcastToClients(data);
});

// actionsトピックをサブスクライブし、クライアントにブロードキャスト
await firehose.subscribe("actions", (data) => {
  firehose.broadcastToClients(data);
});
```
