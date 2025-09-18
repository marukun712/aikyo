---
title: P2P通信
description: aikyoにおけるP2P通信アーキテクチャの詳細
---

## P2P通信の概要

aikyoはlibp2pとGossipSubを使用して、コンパニオン間の分散通信を実現します。各コンパニオンは自律的にP2Pネットワークに参加し、中央サーバーを必要とせずに相互に通信できます。

各コンパニオンは以下の流れで通信を行います。

1. **ピア発見**: mDNSでローカルネットワーク内の他コンパニオンを発見
2. **接続確立**: 発見したピアと自動的に接続
3. **Pub/Sub参加**: GossipSubで通信トピックに自動参加

## 実装の詳細

### ピア発見・接続

コンパニオンは起動時にlibp2pノードをセットアップし、ローカルネットワーク上の他のピア（コンパニオン）を探し始めます。

```typescript
// packages/server/lib/server/companionServer.ts
const libp2p = await createLibp2p({
  peerDiscovery: [mdns()],
  // ...その他設定
});

// 新しいピアを発見したら自動接続
libp2p.addEventListener("peer:discovery", (evt) => {
  libp2p.dial(evt.detail.multiaddrs);
});
```

### トピック管理

aikyoでは、主に以下のトピック（チャンネル）を使用してメッセージを分類し、送受信します。

- **messages**: 会話のためのメインチャンネル
- **actions**: コンパニオンの行動（ジェスチャーなど）を伝達
- **states**: 各コンパニオンの会話状態（話したい、聞きたいなど）を共有
- **queries**: 他のコンパニオンへの情報照会
- **query-results**: 照会に対する結果

各コンパニオンはこれらのトピックを購読（subscribe）し、メッセージを待受ます。

```typescript
// packages/server/lib/server/companionServer.ts
this.libp2p.services.pubsub.subscribe("messages");
this.libp2p.services.pubsub.subscribe("states");
// ...
```

メッセージを送信（publish）する際は、トピックと内容を指定します。

```typescript
// メッセージの送信例
await libp2p.services.pubsub.publish(
  "messages",
  new TextEncoder().encode(
    JSON.stringify({
      id: "...",
      from: "companion_xxxx",
      to: ["companion_yyyy"],
      message: "こんにちは！",
    }),
  ),
);
```

### メッセージ受信処理

メッセージを受信すると、トピックに応じた処理が実行されます。

```typescript
// packages/server/lib/server/companionServer.ts抜粋
libp2p.services.pubsub.addEventListener("message", (evt) => {
  const topic = evt.detail.topic;
  const data = JSON.parse(new TextDecoder().decode(evt.detail.data));

  // トピックに応じて、それぞれのハンドラー関数を呼び出す
  // e.g. handlePubSubMessage(this, evt)
});
```

## Firehose統合

Firehoseサーバーは、P2Pネットワークと外部のWebSocketクライアントを繋ぐブリッジです。

これにより、ユーザーはWebSocketがつながる環境であれば、複雑なP2P通信のセットアップをせずにネットワークに参加することができるようになります。

### Firehoseの役割

1.  **WebSocketからP2Pへの中継**: クライアントから送られてきたJSONメッセージを解析し、指定されたトピック（例: `messages`）のP2Pネットワークに中継します。

    ```typescript
    // packages/firehose/index.ts
    ws.on("message", (evt) => {
      const data = JSON.parse(evt.toString());
      // RequestSchemaで検証後...
      this.libp2p.services.pubsub.publish(
        data.topic, // 'messages'など
        new TextEncoder().encode(JSON.stringify(data.body)),
      );
    });
    ```

2.  **P2PからWebSocketへの配信**: P2Pネットワーク上のメッセージを購読し、接続されている全てのWebSocketクライアントにブロードキャストします。

    ```typescript
    // packages/firehose/index.ts
    this.libp2p.services.pubsub.addEventListener("message", async (message) => {
      const data = JSON.parse(new TextDecoder().decode(message.detail.data));
      const payload = JSON.stringify(data);
      // 接続されている全クライアントに送信
      for (const client of this.clients) {
        client.send(payload);
      }
    });
    ```

この仕組みにより、クライアント開発者はlibp2pの詳細を意識することなく、使い慣れたWebSocketでAIコンパニオンと通信できます。
