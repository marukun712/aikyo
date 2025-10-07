---
title: P2P通信
description: aikyoのP2P通信アーキテクチャと実装詳細
---

aikyoは**libp2p**を基盤としたP2Pネットワーク上で動作します。これにより、中央サーバーに依存せず、コンパニオン同士が直接通信できる完全分散型のアーキテクチャを実現しています。

## libp2pによるP2Pネットワーク

### ネットワーク構成

各コンパニオンとFirehoseサーバーは、libp2pノードとしてP2Pネットワークに参加します。

デフォルトでは、以下の機能が有効化されます：
- TCP/IP通信
- mDNSピア発見
- Gossipsub Pubsubメッセージング
- Noise暗号化
- Yamuxストリームマルチプレクサ

### ピア発見と接続

mDNSにより、同じローカルネットワーク上のコンパニオンを自動的に発見し、接続を試みます。

### メタデータ交換

ピア接続時にカスタムプロトコルを使用してメタデータを交換します。

接続したピアから相手のコンパニオンメタデータ（id、name、personality等）を取得し、`companionList`に保存します。

## Gossipsub通信

aikyoでは3つの主要トピックを使用してGossipsubメッセージングを行います。

### トピック一覧

| トピック | 用途 | メッセージ型 |
|---------|------|------------|
| `messages` | コンパニオン間の会話メッセージ | `Message` |
| `states` | ターンテイキング用の状態通知 | `State` |
| `queries` | クエリリクエスト・レスポンス | `Query`, `QueryResult` |
| `actions` | クライアント向けアクション通知 | `Action` |

## Firehoseサーバー

Firehoseは、WebSocketクライアントとlibp2pネットワークをブリッジする役割を持ちます。

WebSocketがつながる環境であればどこでもP2Pネットワークに参加できます。

## JSON-RPC 2.0プロトコル

aikyoでは全てのメッセージをJSON-RPC 2.0形式で統一しています。

```typescript
export const MessageSchema = z.object({
  jsonrpc: z.literal("2.0"),
  method: z.literal("message.send"),
  params: z.object({
    id: z.string(),
    from: z.string(),
    to: z.array(z.string()),
    message: z.string(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
});
```

この統一により、クライアント・サーバー間で一貫したメッセージ処理が可能になります。
