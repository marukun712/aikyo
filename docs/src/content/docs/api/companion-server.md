---
title: CompanionServer
description: CompanionServerクラスのAPIリファレンス
---

`CompanionServer`は、コンパニオンのP2Pサーバー機能を提供するクラスです。libp2pノードの管理、メッセージング、ターンテイキング、メタデータ交換を統合します。

## インポート

```typescript
import { CompanionServer } from "@aikyo/server";
```

## コンストラクタ

```typescript
constructor(
  companionAgent: CompanionAgent,
  history: Message[],
  config?: { timeoutDuration: number },
  libp2pConfig?: Libp2pOptions<Services>
)
```

### パラメータ

| パラメータ | 型 | 説明 | デフォルト |
|-----------|-----|------|-----------|
| `companionAgent` | `CompanionAgent` | コンパニオンエージェントのインスタンス | - |
| `history` | `Message[]` | 会話履歴の配列（CompanionAgentと同じ参照を渡す） | - |
| `config` | `object` | オプション設定 | `{ timeoutDuration: 5000 }` |
| `config.timeoutDuration` | `number` | ターンテイキング後の発言待機時間（ミリ秒） | `5000` |
| `libp2pConfig` | `Libp2pOptions<Services>` | オプション。libp2pノードのカスタム設定 | - |

### 使用例

```typescript
import { CompanionAgent, CompanionServer, type Message } from "@aikyo/server";
import { anthropic } from "@ai-sdk/anthropic";

const history: Message[] = [];

const companion = new CompanionAgent(
  companionCard,
  anthropic("claude-3-5-haiku-latest"),
  history
);

const server = new CompanionServer(companion, history, {
  timeoutDuration: 1000
});

await server.start();
```

カスタムlibp2p設定を使用する場合は、完全な設定を提供する必要があります：

```typescript
import { CompanionAgent, CompanionServer, type Message } from "@aikyo/server";
import { anthropic } from "@ai-sdk/anthropic";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import { mdns } from "@libp2p/mdns";
import { tcp } from "@libp2p/tcp";

const history: Message[] = [];
const companion = new CompanionAgent(
  companionCard,
  anthropic("claude-3-5-haiku-latest"),
  history
);

const customServer = new CompanionServer(
  companion,
  history,
  { timeoutDuration: 1000 },
  {
    addresses: { listen: ["/ip4/0.0.0.0/tcp/9000"] },
    transports: [tcp()],
    peerDiscovery: [mdns()],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    services: {
      pubsub: gossipsub({
        allowPublishToZeroTopicPeers: true,
        emitSelf: true,
      }),
      identify: identify(),
    },
  }
);

await customServer.start();
```

## プロパティ

### companionAgent

```typescript
companionAgent: CompanionAgent
```

コンパニオンエージェントのインスタンス。

### history

```typescript
history: Message[]
```

会話履歴の配列（参照）。

### turnTakingManager

```typescript
turnTakingManager: TurnTakingManager
```

ターンテイキングを管理するマネージャー。詳細は[ターンテイキング](../core/turn-taking)を参照。

```typescript
this.turnTakingManager = new TurnTakingManager(
  this.companionAgent,
  config ? config.timeoutDuration : 5000,
);
```

### companion

```typescript
companion: CompanionCard
```

コンパニオンの設定カード（`companionAgent.companion`と同じ）。

### libp2p

```typescript
libp2p: Libp2p<Services>
```

libp2pノードのインスタンス。P2P通信の核となるオブジェクトです。

```typescript
this.libp2p = await createLibp2p({
  addresses: { listen: ["/ip4/0.0.0.0/tcp/0"] },
  transports: [tcp()],
  peerDiscovery: [mdns()],
  connectionEncrypters: [noise()],
  streamMuxers: [yamux()],
  services: {
    pubsub: gossipsub({
      allowPublishToZeroTopicPeers: true,
      emitSelf: true,
    }),
    identify: identify(),
  },
});
```

詳細は[P2P通信](../core/p2p)を参照。

### companionList

```typescript
companionList: Map<string, Metadata>
```

接続中のコンパニオンのメタデータを管理するMap。

```typescript
companionList = new Map<string, Metadata>();
```

**初期化時:**

```typescript
this.companionList.set(this.companion.metadata.id, this.companion.metadata);
```

自分自身をまず登録し、ピア接続時に相手のメタデータを追加します（`packages/server/lib/server/handlers/peer.ts:12-30`）。

### pendingQueries

```typescript
pendingQueries = new Map<
  string,
  {
    resolve: (value: QueryResult) => void;
    reject: (reason: string) => void;
  }
>();
```

クライアントへのクエリ待機状態を管理するMap。詳細は[Query](../tools/query#pendingqueries管理)を参照。

### libp2pConfig

```typescript
libp2pConfig?: Libp2pOptions<Services>
```

オプション。libp2pノードのカスタム設定。指定しない場合はデフォルト設定が使用されます。

## メソッド

### start()

サーバーを起動します。

```typescript
async start(): Promise<void>
```

**処理フロー:**

1. libp2pノードを初期化（`setupLibp2p()`）
2. イベントリスナーを登録
3. コンソールにログを出力

```typescript
async start() {
  await this.setupLibp2p();
  console.log(
    `Companion started: ${this.companion.metadata.name} ` +
      `(id=${this.companion.metadata.id}, peerId=${this.libp2p.peerId.toString()})`,
  );
}
```

**出力例:**

```
Companion started: aya (id=companion_aya, peerId=12D3KooW...)
```

### handleMessageReceived()

メッセージ受信時の処理を行います。

```typescript
async handleMessageReceived(message: Message): Promise<void>
```

**パラメータ:**

- `message`: 受信したメッセージ

**処理フロー:**

1. `TurnTakingManager`にメッセージを登録
2. 自分の`State`を生成
3. `states`トピックにStateをパブリッシュ

```typescript
async handleMessageReceived(message: AikyoMessage) {
  this.turnTakingManager.addPending(message);
  const state = await this.companionAgent.generateState(message);
  this.libp2p.services.pubsub.publish(
    "states",
    new TextEncoder().encode(JSON.stringify(state)),
  );
}
```

このメソッドは`handlePubSubMessage`から呼び出されます。