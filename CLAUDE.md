# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

必ず日本語で回答してください。

## 開発コマンド

### 全サービス起動
```bash
task run
```

### 個別サービス開発
```bash
# Registry Server (データ管理)
cd registry-server && bun run dev

# Control Panel (Web UI)
cd control-panel && bun run dev

# Companion Server (AI)
cd companion-server && bun run dev

# Body Server (物理動作)
cd body-server && bun run dev

# Relay Server (通信ハブ)
cd relay-server && bun run dev
```

### ビルド・デプロイ
```bash
# Control Panel
cd control-panel && bun run build && bun run start

# Companion Server
cd companion-server && bun run build && bun run start
```

### データベース操作
```bash
# Registry Server内でPrismaコマンド実行
cd registry-server
bun prisma generate  # Prismaクライアント生成
bun prisma migrate dev  # マイグレーション実行
bun prisma studio  # データベースGUI
```

## アーキテクチャ

AICompanionProtocolは仮想空間でのAIコンパニオンシステムです。

### コアコンポーネント

1. **registry-server** (ポート3000)
   - Prisma + PostgreSQLによるデータ管理
   - Room、Companion、Furnitureモデル
   - REST API提供

2. **companion-server** 
   - Mastraフレームワーク + Claude 3.5 Haiku
   - MQTT経由でメッセージ受信・AI応答生成
   - MCP経由でbody-serverのツール利用

3. **control-panel** (ポート8000)
   - Next.js + React管理画面
   - コンパニオン・部屋・家具の視覚的管理

4. **body-server** (ポート3001)
   - MCPサーバーとして物理動作ツール提供
   - move、look、gestureアクション

5. **relay-server**
   - MQTT通信ハブ

### 通信フロー
Control Panel → Registry Server → Companion Server → Body Server → MQTT

### 技術スタック
- **フロントエンド**: Next.js 15, React 19, Tailwind CSS 4
- **バックエンド**: Hono, Bun runtime
- **AI**: Mastra + Claude 3.5 Haiku
- **データベース**: Prisma + PostgreSQL
- **通信**: MQTT, MCP (Model Context Protocol)
- **コンテナ**: Docker
