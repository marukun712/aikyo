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
constructor(port: number)
```

### パラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `port` | `number` | WebSocketサーバーのポート番号 |

### 使用例

```typescript
import { Firehose } from "@aikyo/firehose";

const firehose = new Firehose(8080);
await firehose.start();
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

## メソッド

### start()

Firehoseサーバーを起動します。

```typescript
async start(): Promise<void>
```
