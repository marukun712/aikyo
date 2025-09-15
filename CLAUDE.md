# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

必ず日本語で回答してください。

## Project Overview

aikyoは、相互接続されたAIコンパニオンを構築するためのフレームワークです。libp2pを使用したP2Pネットワーク上で動作し、複数のAIコンパニオンが自然な会話を行えます。

## Architecture

- **packages/server/**: Mastraベースのサーバーコンポーネント。AIコンパニオンの実行環境
- **packages/firehose/**: WebSocketを使用したメッセージング用のP2Pファイアホースサーバー  
- **packages/utils/**: ユーティリティとlibp2p関連の共通機能
- **configs/**: 各AIコンパニオンの設定ファイル（aya、kyokoなど）
- **scripts/**: companion.tsによるコンパニオン起動スクリプト
- **apm_dependencies/**: APM関連の依存関係

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
2. `companion.ts`ファイルを実装
3. `pnpm run companion <name>`で起動

## Testing

プロジェクトにはテストスクリプトが定義されていません。テストを追加する場合は適切なテストランナーを設定してください。
