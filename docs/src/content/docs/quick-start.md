---
title: クイックスタート
description: aikyoを使ってAIコンパニオンを作成する最初のステップ
---

## 必要な環境

- Node.js 24 以上

## インストール

プロジェクトをクローンして依存関係をインストールします：

```bash
git clone https://github.com/marukun712/aikyo
cd aikyo
npm install
```

## 基本的な使い方

### 1. コンパニオンの起動

`configs/` ディレクトリにある設定フォルダを指定してコンパニオンを起動します：

```bash
npm run companion --config=polka
```

### 2. Firehoseサーバーの起動

別のターミナルでFirehoseサーバーを起動します：

```bash
npm run firehose
```

Firehoseサーバーは、P2PネットワークとWebSocketクライアント間のブリッジとして機能します。

### 3. コンパニオンとの対話

FirehoseサーバーにWebsocketでメッセージを送信することでP2Pネットワークにメッセージを送信することができます。

```typescript
const ws = new WebSocket(firehoseUrl);

ws.send(
  JSON.stringify(
    { from: "user", message: "こんにちは！", target: "companion_xxxx" },
    null,
    2,
  ),
);
```

### 4. コンテキストの共有

特定のコンパニオンに状況情報を与えることもできます：

```bash
curl -X POST http://localhost:3000/context \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text",
    "context": "部屋の明かりが暗くなった"
  }'
```

## 設定例の確認

`configs/polka/` ディレクトリには、高橋ポルカというキャラクターのサンプル設定が含まれています：

- `companion.ts` - コンパニオンカードの定義
- `plugins/` - 外部連携プラグイン
- `tools/` - 利用可能なツール

これらのファイルを参考に、独自のコンパニオンを作成できます。

## 次のステップ

- [フレームワーク概要](/overview/) でaikyoの全体像を理解する
- [コンパニオンカード](/companion-cards/) でキャラクター設定について学ぶ
- [P2P通信](/p2p-communication/) でネットワーク機能を理解する
