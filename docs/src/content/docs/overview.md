---
title: フレームワーク概要
description: aikyoフレームワークの全体像と主要な概念について
---

## aikyoとは

aikyoは、相互につながるAIコンパニオンを作成するためのフレームワークです。バーチャルな体を持ったAIコンパニオンが、P2P（Peer-to-Peer）ネットワークを通じて自律的にコミュニケーションを行う環境を提供します。

## アーキテクチャ概要

aikyoは以下の主要コンポーネントで構成されています。

### コア要素

- **Companion Card** - AIコンパニオンの設計書
- **P2P Network** - libp2pを使用した分散通信基盤
- **Firehose Server** - WebSocketブリッジサーバー
- **Action System** - コンパニオンの行動制御
- **Knowledge System** - 動的な知識取得機能

### システム構成

```
WebSocket Client ←──→ Firehose Server ←──→ P2P Network
                      (WebSocket)          (libp2p)
                                              ↑
                                        Companion A
                                        Companion B
                                        Companion C
```

## メッセージタイプ

aikyoでは、3種類のメッセージを定義しています。

### 1. Message - コミュニケーション

コンパニオン間、または人間とのメッセージ交換に使用します。

```json
{
  "from": "companion_xxxx",
  "message": "こんにちは！",
  "target": "target-companion-id",
  "metadata": {}
}
```

### 2. Action - 物理的動作

コンパニオンの体の動きを表現するためのメッセージです（送信のみ）。

```json
{
  "from": "companion_xxxx",
  "name": "gesture",
  "params": {
    "type": "wave"
  },
  "metadata": {}
}
```

### 3. Context - 共通認識

コンパニオン間で共有する状況情報を配信します。

```json
{
  "type": "text",
  "context": "部屋の明かりが暗くなった"
}
```

## Companion Card

AIコンパニオンの設計書となるJSONベースの設定ファイルです。以下の要素を定義できます。

- **メタデータ** - ID、名前、性格、ストーリー
- **役割（Role）** - コンパニオンの基本的な役割定義
- **アクション** - 実行可能な行動の定義
- **ナレッジ** - 動的に取得する知識の定義
- **イベント** - 条件分岐とツール実行の定義

### イベントシステム

Companion Cardでは、CEL（Common Expression Language）を使用した条件分岐システムを提供しています。

```json
events: {
  params: {
    // LLMが判断するパラメータの定義
    properties: {
      interaction_type: {
        enum: ["user", "companion"],
        type: "string"
      },
      need_reply: {
        type: "boolean"
      }
    }
  },
  conditions: [
    {
      expression: 'interaction_type === "user" && need_reply === true',
      execute: [
        {
          instruction: "応答する",
          tool: speakAction
        }
      ]
    }
  ]
}
```

## ツールシステム

### Action（アクション）

コンパニオンが実行できる行動を定義します。

```typescript
export const gestureAction = createCompanionAction({
  id: "gesture",
  description: "体の動きを表現する",
  inputSchema: z.object({
    type: z.enum(["wave", "jump", "dance", "nod", "stretch", "clap"]),
  }),
  topic: "actions",
  publish: ({ type }) => ({
    from: companionCard.metadata.id,
    name: "gesture",
    params: { type },
  }),
});
```

### Knowledge（ナレッジ）

動的に外部から知識を取得する機能を定義します。

```typescript
export const environmentDBKnowledge = createCompanionKnowledge({
  id: "environment-db",
  description: "あなたの部屋の家具情報などを取得します。",
  inputSchema: z.object({
    label: z.enum(semanticLabels),
  }),
  knowledge: async ({ label }) => {
    const json = await fetcher.fetch(label);
    const data = JSON.stringify(json, null, 2);
    return data;
  },
});
```

## P2P通信アーキテクチャ

aikyoはlibp2pとGossipSubを使用した分散通信システムを採用しています。

### ピア発見・接続

- mDNSによるローカルネットワーク内でのピア発見
- 自動的な接続確立とネットワーク参加

### トピックベース通信

- `messages` - コンパニオン間メッセージ
- `actions` - 物理的動作データ
- `contexts` - 共有状況情報

### Firehose統合

Firehoseサーバーが、WebSocketクライアントとP2Pネットワーク間のブリッジとして機能し、クライアントがP2P技術を直接実装する必要性を排除します。

## 開発フロー

1. **Companion Cardの作成** - キャラクター設定と行動定義
2. **アクション・ナレッジの実装** - 必要な機能の開発
3. **P2Pネットワークへの参加** - コンパニオンの起動
4. **Firehose経由での連携** - クライアントアプリケーションとの統合

aikyoを使用することで、複雑なP2P通信やAI制御を意識することなく、魅力的なAIコンパニオンシステムを構築できます。
