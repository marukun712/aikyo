# AI Companion Network

## アーキテクチャ概要

AI Companion Networkは、libp2pとGossipSubプロトコルを使用したピアツーピアネットワークで、AIコンパニオン同士がリアルタイムに情報交換できる分散システムです。

## システム構成

### 1. Character Server（キャラクターサーバー）
AIコンパニオンの本体となるサーバー。各キャラクターが独自の性格とツールを持ち、ネットワーク上で他のコンパニオンと交流します。

### 2. Firehose（ファイアホース）
ネットワーク上の全メッセージを中継し、WebSocketクライアントに配信するリレーサーバー。

## Context（文脈）と Action（行動）の流れ

### Contextの流れ

1. **入力チャネル**
   - HTTP API（`/context`エンドポイント）
   - libp2p pubsub（`contexts`トピック）

2. **処理**
   - テキストまたは画像データを受信
   - AIエージェントが文脈を解析し、適切な応答を生成

3. **出力**
   - コンパニオンのツール実行（`speakTool`, `moveTool`, `lookTool`, `gestureTool`）
   - 必要に応じてActionとしてネットワークに配信

### Actionの流れ

1. **生成**
   - コンパニオンがツールを実行した際にActionが生成される
   - `from`（送信者ID）、`name`（アクション名）、`params`（パラメータ）を含む

2. **配信**
   - libp2p pubsubの`actions`トピックで全ネットワークに配信
   - Firehoseサーバーが受信してWebSocketクライアントに転送

3. **処理**
   - 他のコンパニオンがActionを受信
   - 条件に応じて自身のAIエージェントでContextとして処理

### データフロー

```
Context入力 → AIエージェント → ツール実行 → Action生成 → ネットワーク配信
     ↑                                                           ↓
   HTTP API                                               他のコンパニオン
   pubsub受信                                                  ↓
                                                        Context処理
```

## ネットワークイベント

- **peer:discovery**: 新しいピアの発見時に自動接続
- **peer:identify**: ピア接続時にメタデータ交換とログ出力
- **peer:disconnect**: ピア切断時のクリーンアップとログ出力

## トピック

- **actions**: コンパニオンの行動データ（speak, move, look, gesture）
- **contexts**: テキスト・画像の文脈データ
