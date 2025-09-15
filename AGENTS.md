# Repository Guidelines

## Project Structure & Module Organization

aikyoは、相互接続されたAIコンパニオンを構築するためのフレームワークです。libp2pを使用したP2Pネットワーク上で動作します。

### ディレクトリ構造
```
aikyo/
├── packages/
│   ├── server/          # Mastraベースのサーバーコンポーネント（AIコンパニオンの実行環境）
│   ├── firehose/        # WebSocketを使用したメッセージング用のP2Pファイアホースサーバー
│   └── utils/           # ユーティリティとlibp2p関連の共通機能
├── configs/             # 各AIコンパニオンの設定ファイル（aya、kyokoなど）
├── scripts/             # companion.tsによるコンパニオン起動スクリプト
└── apm_dependencies/    # APM関連の依存関係
```

### パッケージ間の依存関係
- **packages/server/**: Mastraフレームワークを使用してAIコンパニオンを実行
- **packages/firehose/**: P2P通信のためのWebSocketサーバー
- **packages/utils/**: 共通のlibp2p機能とユーティリティ

## Build, Test, and Development Commands

### 開発環境のセットアップ
```bash
# 依存関係のインストール
pnpm i

# 環境設定ファイルの作成
cp .env.example .env
```

### システムの起動
```bash
# 1. ファイアホースサーバーの起動 (localhost:8080)
pnpm run firehose

# 2. コンパニオンの起動（別ターミナルで）
pnpm run companion <companion_name>
# 例: pnpm run companion aya
```

### コード品質管理
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

### リリース管理
```bash
# changesetの作成
pnpm run changeset

# パッケージのパブリッシュ
pnpm run release
```

## Coding Style & Naming Conventions

### フォーマッター・リンター
- **Biome**: コードフォーマッターおよびリンターとして使用
- 設定は`.biomejs`設定ファイルで管理
- `pnpm run check:fix`ですべての品質チェックを実行

### TypeScript設定
- プロジェクト全体でTypeScriptを使用
- ES Modulesをサポート（`"type": "module"`）

### パッケージ管理
- **pnpm**: パッケージマネージャーとして使用（v10.16.1）
- **catalog**: 依存関係のバージョン管理

## Testing Guidelines

現在、プロジェクトにはテストスクリプトが定義されていません。テストを追加する場合は適切なテストランナーを設定してください。

## Commit & Pull Request Guidelines

### Changeset使用
- コードの変更時は`pnpm run changeset`でChangesetを作成
- リリース時は`pnpm run release`でパブリッシュ

### ブランチ戦略
- メインブランチ: `main`
- 機能ブランチ: `feature/`プレフィックスを使用

## Security & Configuration Tips

### 環境変数設定
`.env`ファイルで以下のAPIキーを設定：
- `OPENROUTER_API_KEY`: OpenRouter API
- `ANTHROPIC_API_KEY`: Anthropic Claude API

### 依存関係管理
- **Mastra**: AI integrationフレームワーク（ai-v5版）
- **libp2p**: P2Pネットワーク通信
- **CEL**: ツール使用ルールの定義
- **Zod**: スキーマバリデーション

### 新しいコンパニオンの追加
1. `configs/<name>/`ディレクトリを作成
2. `companion.ts`ファイルを実装
3. `pnpm run companion <name>`で起動
