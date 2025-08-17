# MRTalk - 分散型AIコンパニオンシステム

MRTalkは、LibP2Pネットワークを利用した分散型AIコンパニオンシステムです。複数のAIエージェント（コンパニオン）がP2Pネットワーク上で相互通信し、リアルタイムでWebSocketクライアントに行動データを配信します。

## システム構成

### アーキテクチャ概要

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  character-server│     │  character-server│     │    firehose     │
│   (コンパニオン)  │◄────┤   (コンパニオン)  │◄────┤  (データ配信)    │
│                 │     │                 │     │                 │
│   AI Agent      │     │   AI Agent      │     │  WebSocket      │
│   ↓             │     │   ↓             │     │  Server         │
│ LibP2P Network  │◄────┤ LibP2P Network  │     │       ↓         │
└─────────────────┘     └─────────────────┘     │  WebSocket      │
                                                │  Clients        │
                                                └─────────────────┘
```

## 各コンポーネント

### 1. character-server（AIコンパニオン）

各character-serverは独立したAIコンパニオンを実行し、以下の機能を提供します：

#### 主要機能
- **AI Agent**: Mastraフレームワークを使用したClaude-4 Sonnetベースのエージェント
- **P2Pネットワーク**: LibP2P Gossipsubによる分散メッセージング
- **長期記憶**: LibSQLによる永続化されたメモリストレージ
- **HTTP API**: 外部からのコンテキスト送信エンドポイント

#### ネットワーク通信
- **Peer Discovery**: mDNSによる自動ピア発見
- **メッセージング**: 
  - `actions`トピック: コンパニオン間の行動（speak, move, look, gesture）
  - `contexts`トピック: テキスト・画像コンテキストの共有

#### コンパニオン定義
`config/companion.ts`で各コンパニオンの特性を定義：
- **メタデータ**: ID、名前、性格、背景ストーリー
- **行動ツール**: speak, move, look, gesture
- **イベント条件**: ツール実行のトリガー条件

#### 技術スタック
- **フレームワーク**: Mastra Core
- **LLM**: Claude-4 Sonnet (Anthropic)
- **ネットワーク**: LibP2P + Gossipsub
- **データベース**: LibSQL
- **Webサーバー**: Hono + Node.js

### 2. firehose（データ配信サーバー）

P2Pネットワークから行動データを受信し、WebSocketクライアントにリアルタイム配信します。

#### 主要機能
- **P2Pネットワーク参加**: character-serverと同一のLibP2Pネットワークに参加
- **データ中継**: `actions`トピックのメッセージをWebSocketで配信
- **WebSocketサーバー**: ポート8080でクライアント接続を受付

#### 技術スタック
- **ネットワーク**: LibP2P + Gossipsub
- **WebSocket**: ws (Node.js)

## データフロー

### 1. コンパニオン間通信
```
コンパニオンA → [LibP2P Network] → コンパニオンB
                     ↓
               firehose受信
                     ↓
              WebSocketクライアント
```

### 2. 外部コンテキスト入力
```
HTTP Client → character-server:3000/context
                     ↓
                AI Agent処理
                     ↓
              行動生成・P2P配信
```

### 3. メッセージ形式

#### Action Message
```json
{
  "from": "コンパニオンID",
  "name": "speak|move|look|gesture",
  "params": {
    "message": "発話内容",
    "target": "対象コンパニオン（任意）"
  }
}
```

#### Context Message
```json
{
  "type": "text|image",
  "context": "テキスト内容 or Base64画像データ"
}
```

## セットアップ・実行

### character-server
```bash
cd character-server
npm install
npm run dev
```

### firehose
```bash
cd firehose
npm install
npm run dev
```

## 特徴

- **分散型**: 中央サーバー不要のP2Pネットワーク
- **リアルタイム**: LibP2P Gossipsubによる低遅延メッセージング
- **拡張性**: 新しいコンパニオンの動的参加・離脱
- **永続性**: LibSQLによる長期記憶の保持
- **マルチモーダル**: テキスト・画像両方のコンテキスト処理

このシステムは、複数のAIコンパニオンが自律的に相互作用し、その様子をリアルタイムで観察・参加できる新しい形のマルチエージェントプラットフォームです。