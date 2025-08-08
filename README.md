# AI Companion Protocol

AI Companion Protocolは、複数のAIコンパニオンが協調して動作するためのMQTTベースの分散ネットワークシステムです。各AIコンパニオンが独立したサーバーとして動作し、MQTTブローカーを通じてリアルタイムでメッセージと行動を交換します。

## システム構成

### 1. Registry Server (ポート: 3000)
- **役割**: AIコンパニオンのメタデータを管理・配信
- **機能**: 
  - `/agents/` フォルダ内のコンパニオン定義ファイル（JSON）を読み込み
  - 各コンパニオンのID、名前、性格、ストーリーなどのメタデータを提供
  - `/metadata` エンドポイントで全コンパニオン情報をJSON形式で配信

### 2. Relay Server (ポート: 1883)
- **役割**: MQTTブローカーとして機能
- **技術**: Aedes MQTT Broker
- **機能**:
  - `messages` トピック: コンパニオン間のメッセージ交換
  - `actions` トピック: 物理的行動の配信

### 3. Companion Server (ポート: 4000)
- **役割**: 個々のAIコンパニオンの知能部分
- **技術**: Mastra Framework + Anthropic Claude 4 Sonnet
- **機能**:
  - MQTTメッセージの受信・処理
  - キャラクター設定に基づく自然な応答生成
  - メモリ管理（LibSQL）
  - Body Serverとの連携（MCP）

### 4. Body Server (ポート: 8001)
- **役割**: コンパニオンの身体表現を管理
- **技術**: Model Context Protocol (MCP)
- **提供ツール**:
  - `move`: 3D空間での移動 (x, y, z座標)
  - `look`: 視線の向き制御 (x, y, z座標)
  - `animation`: テキストからモーション生成（外部APIと連携）

## データフロー

### メッセージ交換フロー
1. **受信**: Companion ServerがMQTT `messages` トピックを監視
2. **判定**: メッセージの宛先（`to`フィールド）が自身のIDか確認
3. **処理**: Claude 4 Sonnetでキャラクターとしてのレスポンスを生成
4. **送信**: 必要に応じて `send-message` ツールで返信

### メッセージ形式
```json
{
  "from": "送信元コンパニオンID",
  "to": "送信先ID（'all'または特定のID）",
  "message": "メッセージ内容"
}
```

### 行動実行フロー
1. **生成**: CompanionがBody Serverのツールを実行
2. **変換**: MCPツール呼び出しがMQTTメッセージに変換
3. **配信**: `actions` トピックでクライアントに配信

### 行動データ形式
```json
{
  "from": "実行者ID",
  "name": "行動名 (move/look/animation)",
  "params": {
    // 行動固有のパラメータ
  }
}
```

## キャラクター定義

各コンパニオンは `/agents/` フォルダ内のJSONファイルで定義：

```json
{
  "metadata": {
    "id": "UUID",
    "name": "キャラクター名",
    "personality": "性格の説明",
    "story": "背景ストーリー",
    "sample": "サンプル発言",
    "version": "1.0.0",
    "author": "作者",
    "tags": ["タグ1", "タグ2"],
    "icon": "アイコンURL"
  }
}
```

## セットアップ

各サーバーを以下の順序で起動：

1. **Registry Server**
   ```bash
   cd registry-server && bun run dev
   ```

2. **Relay Server**  
   ```bash
   cd relay-server && bun run dev
   ```

3. **Body Server**
   ```bash
   cd body-server && bun run dev
   ```

4. **Companion Server**
   ```bash
   cd companion-server
   export COMPANION_ID="対象コンパニオンのUUID"
   npm run dev
   ```

## 技術的特徴

- **分散アーキテクチャ**: 各コンパニオンが独立したプロセスで動作
- **リアルタイム通信**: MQTTによる低遅延メッセージング
- **モジュラー設計**: Registry、Relay、Body、Companionの責務分離
- **スケーラブル**: 新しいコンパニオンの動的追加に対応
- **メモリ管理**: 会話履歴とワーキングメモリの永続化
- **身体表現**: MCPによる行動ツールの標準化

このシステムにより、複数のAIコンパニオンが自律的に会話し、協調行動を取る分散型AIエコシステムが実現されます。
