---
title: クイックスタート
description: aikyoを使ってAIコンパニオンを作成する最初のステップ
---

## 必要な環境

- Node.js 20 以上
- pnpm

## 1. インストール

プロジェクトをクローンして、pnpmを使って依存関係をインストールします。

```bash
git clone https://github.com/marukun712/aikyo
cd aikyo/
pnpm install
```

## 2. コンパニオンの準備

まず、既存の設定をコピーして、あなただけのコンパニオン設定を作成します。ここでは例として `aya` の設定を `my-companion` という名前でコピーします。

```bash
cp -r configs/aya configs/my-companion
```

これで `configs/my-companion` ディレクトリが作成されました。この中の `companion.ts` ファイルを編集することで、コンパニオンの性格や能力をカスタマイズできます。

## 3. 起動

aikyoを動かすには、「コンパニオン」と「Firehoseサーバー」の2つを起動する必要があります。それぞれ別のターミナルで実行してください。

### ターミナル 1: コンパニオンの起動

先ほど作成したコンパニオン設定を指定して起動します。

```bash
pnpm companion my-companion
```

起動すると、ターミナルにコンパニオンの情報が表示されます。この中の `id`（`companion_`から始まる文字列）を後で使うので、コピーしておいてください。

```
Companion started: Aya (id=companion_aya, peerId=...)
```

### ターミナル 2: Firehoseサーバーの起動

Firehoseは、P2Pネットワークとクライアントアプリケーション（あなたからのメッセージ）を繋ぐためのWebSocketサーバーです。

```bash
pnpm firehose
```

`aikyo firehose server running on ws://localhost:8080` と表示されれば成功です。

## 4. コンパニオンとの対話

FirehoseサーバーにWebSocketで接続し、メッセージを送ることでコンパニオンと対話できます。

以下のサンプルコード（Node.js）を `test.ts` のような名前で保存し、実行してみてください。

```typescript
import WebSocket from 'ws';

const firehoseUrl = 'ws://localhost:8080';
const ws = new WebSocket(firehoseUrl);

// 手順3でコピーしたあなたのコンパニオンIDに置き換えてください
const companionId = 'companion_aya';
const userId = 'user_yamada';

ws.on('open', () => {
  console.log('Connected to Firehose.');

  const message = {
    topic: 'messages',
    body: {
      id: crypto.randomUUID(),
      from: userId,
      to: [companionId],
      message: 'こんにちは！はじめまして。',
    },
  };

  // メッセージを送信
  ws.send(JSON.stringify(message));
  console.log('Message sent:', message);
});

// コンパニオンからの返信やネットワーク上のメッセージを受信
ws.on('message', (data) => {
  console.log('Received from Firehose:', JSON.parse(data.toString()));
});

ws.on('close', () => {
  console.log('Disconnected from Firehose.');
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

実行する前に、`ws` パッケージをインストールしてください。
```bash
pnpm add ws
```

そして、スクリプトを実行します。
```bash
node test.js
```

コンパニオンからの返信がターミナルに表示されるはずです。

## 次のステップ

- [フレームワーク概要](/overview/) でaikyoの全体像を理解する
- [コンパニオンカード](/companion-cards/) でキャラクター設定について学ぶ
- [P2P通信](/p2p-communication/) でネットワーク機能を理解する
