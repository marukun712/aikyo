---
title: P2P通信
description: aikyoにおけるP2P（Peer-to-Peer）通信アーキテクチャの詳細
---

## P2P通信の概要

aikyoはlibp2pとGossipSubを使用して、コンパニオン間の分散通信を実現します。各コンパニオンは自律的にP2Pネットワークに参加し、中央サーバーを必要とせずに相互に通信できます。

## ネットワーク構成

```
Companion A ←──→ Companion B
    ↓              ↓
    P2P Network (libp2p)
    ↓              ↓
Companion C ←──→ Companion D
```

各コンパニオンは以下の流れで通信を行います。

1. **ピア発見** - mDNSでローカルネットワーク内の他コンパニオンを発見
2. **接続確立** - 発見したピアと自動的に接続
3. **Pub/Sub参加** - GossipSubで通信トピックに自動参加

## 実装の詳細

### ピア発見・接続

```typescript
// core/lib/server/index.ts
const libp2p = await createLibp2p({
  addresses: { listen: ["/ip4/0.0.0.0/tcp/0"] },
  transports: [tcp()],
  peerDiscovery: [mdns()], // ローカルネットワークでピア探索
  connectionEncrypters: [noise()],
  streamMuxers: [yamux()],
  services: {
    pubsub: gossipsub({ allowPublishToZeroTopicPeers: true }),
    identify: identify(),
  },
});

// 新しいピアを発見したら自動接続
libp2p.addEventListener("peer:discovery", (evt) => {
  libp2p.dial(evt.detail.multiaddrs);
});
```

### トピック管理

aikyoでは、以下の3つのトピックを使用してメッセージを分類します。

#### 1. messages トピック

コンパニオン間、または人間とのメッセージ交換に使用。

```typescript
libp2p.services.pubsub.subscribe("messages");

// メッセージの送信
await libp2p.services.pubsub.publish(
  "messages",
  new TextEncoder().encode(
    JSON.stringify({
      from: "companion_xxxx",
      message: "こんにちは！",
      target: "target-companion-id",
      metadata: {},
    }),
  ),
);
```

#### 2. actions トピック

コンパニオンの物理的動作データの配信に使用。

```typescript
libp2p.services.pubsub.subscribe("actions");

// アクションの送信
await libp2p.services.pubsub.publish(
  "actions",
  new TextEncoder().encode(
    JSON.stringify({
      from: "companion_xxxx",
      name: "gesture",
      params: { type: "wave" },
      metadata: {},
    }),
  ),
);
```

#### 3. contexts トピック

コンパニオン間で共有する状況情報の配信に使用。

```typescript
libp2p.services.pubsub.subscribe("contexts");

// コンテキストの送信
await libp2p.services.pubsub.publish(
  "contexts",
  new TextEncoder().encode(
    JSON.stringify({
      type: "text",
      context: "部屋の明かりが暗くなった",
    }),
  ),
);
```

### メッセージ受信処理

```typescript
libp2p.services.pubsub.addEventListener("message", (evt) => {
  const topic = evt.detail.topic;
  const data = JSON.parse(new TextDecoder().decode(evt.detail.data));

  switch (topic) {
    case "messages":
      handleMessage(data);
      break;
    case "actions":
      handleAction(data);
      break;
    case "contexts":
      handleContext(data);
      break;
  }
});
```

## Firehose統合

FirehoseサーバーはP2PネットワークとWebSocketクライアント間のブリッジとして機能します。

```
WebSocket Client ←──→ Firehose Server ←──→ P2P Network
                      (WebSocket)          (libp2p)
```

### Firehoseの役割

1. **WebSocketからP2Pへの中継**

   WebSocketクライアントからのメッセージをP2Pネットワークに配信

2. **P2PからWebSocketへの配信**

   P2Pネットワークのメッセージを全WebSocketクライアントに配信

3. **プロトコル変換**

   クライアントがP2P技術を直接実装する必要性を排除

### Firehoseの実装

```typescript
// firehose/index.ts
libp2p.services.pubsub.addEventListener("message", async (message) => {
  const data = JSON.parse(new TextDecoder().decode(message.detail.data));

  // 全WebSocketクライアントに配信
  const payload = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(payload);
    }
  }
});
```
