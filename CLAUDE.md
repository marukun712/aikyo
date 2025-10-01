# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

必ず日本語で回答してください。

## Project Overview

aikyoは、相互接続されたAIコンパニオンを構築するためのフレームワークです。libp2pを使用したP2Pネットワーク上で動作し、複数のAIコンパニオンが自然な会話を行えます。

## Architecture

### Package Structure
- **packages/server/**: Mastraベースのサーバーコンポーネント。AIコンパニオンの実行環境
  - `CompanionAgent`: エージェントのコアロジック、Memory、Workflow管理
  - `CompanionServer`: libp2pベースのP2Pサーバー、TurnTakingManager統合
- **packages/firehose/**: WebSocketを使用したメッセージング用のP2Pファイアホースサーバー
  - libp2pのpubsubをWebSocketでブリッジ
  - `messages`, `queries`, `actions`トピックをSubscribe
- **packages/utils/**: ユーティリティとlibp2p関連の共通機能
  - `createCompanionAction`: Actionツールの作成ヘルパー
  - `createCompanionKnowledge`: Knowledgeツールの作成ヘルパー
- **configs/**: 各AIコンパニオンの設定ファイル（aya、kyokoなど）
- **scripts/**: companion.tsによるコンパニオン起動スクリプト
- **apm_dependencies/**: カスタムのAction・Knowledgeツール定義
  - `core/`: speakToolやcompanionNetworkKnowledgeなど基本ツール
  - `query-tool/`: visionKnowledgeなど拡張ツール

### Core Concepts

#### JSON-RPC 2.0 Protocol
システム全体でJSON-RPC 2.0形式のメッセージを使用：
- **Message**: `message.send` - コンパニオン間の会話メッセージ
- **State**: `state.send` - ターンテイキング用の状態通知
- **Query**: `query.send` - クエリリクエスト（IDつき）
- **QueryResult**: クエリレスポンス（IDつき）
- **Action**: `action.send` - クライアント向けアクション通知

#### Turn-Taking System
`TurnTakingManager`が会話の順番を制御：
- 各コンパニオンが`State`を送信（speak/listen、importance、selected）
- `closing`フィールドで会話終了を段階的に管理（none → pre-closing → closing → terminal）
- `importance`スコアとtimeoutでスピーカーを選択

#### Event-Driven Tool Execution
コンパニオンの`events`設定でCEL式による条件付きツール実行：
1. メッセージ受信時、Workflowが`params`スキーマに基づいてパラメータを評価
2. CEL式（`conditions[].expression`）で条件をチェック
3. マッチした条件の`execute`配列に従ってツールを実行

#### Actions vs Knowledge
- **Actions**: `createCompanionAction`で定義。P2Pネットワークへのメッセージ送信機能
  - `publish`関数でMessage/Queryを生成
  - 例：`speakTool`
- **Knowledge**: `createCompanionKnowledge`で定義。情報取得用（副作用なし）
  - `knowledge`関数で文字列を返す
  - 例：`companionNetworkKnowledge`, `visionKnowledge`

#### Memory System
`@mastra/memory`と`@mastra/libsql`を使用：
- **Long-term memory**: LibSQLVectorで永続化
- **Working memory**: `MemorySchema`で定義された作業記憶
- 各コンパニオンが`db/<companion_id>.db`を使用

## Common Commands

### Development Setup
```bash
# 依存関係のインストール
pnpm i

# 環境設定ファイルの作成
cp .env.example .env
```

### Running the System
```bash
# 1. ファイアホースサーバーの起動 (localhost:8080)
pnpm run firehose

# 2. コンパニオンの起動（別ターミナルで）
pnpm run companion <companion_name>
# 例: pnpm run companion aya
```

### Code Quality
```bash
# フォーマット（Biome使用）
pnpm run format
pnpm run format:fix

# リント
pnpm run lint
pnpm run lint:fix

# チェック（フォーマット+リント）
pnpm run check
pnpm run check:fix
```

### Release Management
```bash
# changesetの作成
pnpm run changeset

# パッケージのパブリッシュ
pnpm run release
```

## Environment Configuration

`.env`ファイルで以下のAPI キーを設定する必要があります:
- `OPENROUTER_API_KEY`: OpenRouter API
- `ANTHROPIC_API_KEY`: Anthropic Claude API

## Package Dependencies

- **Mastra**: AI integrationフレームワーク (ai-v5版)
- **libp2p**: P2Pネットワーク通信
- **CEL**: ツール使用ルールの定義  
- **Biome**: コードフォーマッター・リンター
- **Zod**: スキーマバリデーション

## Companion Configuration

`configs/`ディレクトリ内に各コンパニオンの設定があります。新しいコンパニオンを追加する場合は：

1. `configs/<name>/`ディレクトリを作成
2. `companion.ts`ファイルで`CompanionCard`を実装：
   - `metadata`: id、name、personality、story、sample
   - `role`: コンパニオンの役割記述
   - `actions`: 使用可能なActionツール（例：speakTool）
   - `knowledge`: 使用可能なKnowledgeツール（例：companionNetworkKnowledge）
   - `events`: パラメータスキーマとCEL条件式の配列
3. `CompanionAgent`と`CompanionServer`をインスタンス化
4. `pnpm run companion <name>`で起動

### CompanionCardの例
```typescript
export const companionCard: CompanionCard = {
  metadata: { id: "companion_x", name: "x", personality: "...", story: "...", sample: "..." },
  role: "役割記述",
  actions: { speakTool },
  knowledge: { companionNetworkKnowledge },
  events: {
    params: {
      type: "object",
      properties: {
        need_response: { type: "boolean", description: "返答の必要があるか" }
      }
    },
    conditions: [
      { expression: "need_response == true", execute: [{ instruction: "返信する", tool: speakTool }] }
    ]
  }
};
```

## Development Guidelines

### カスタムツールの作成
`apm_dependencies/`ディレクトリにツールを追加：
- **Action**: `createCompanionAction`でネットワークへの送信機能を実装
- **Knowledge**: `createCompanionKnowledge`で情報取得機能を実装

### パッケージビルド
```bash
# 全パッケージをビルド
pnpm run bundle
```

## Testing

プロジェクトにはテストスクリプトが定義されていません。テストを追加する場合は適切なテストランナーを設定してください。
