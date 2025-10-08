# aikyo

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/marukun712/aikyo)  
[**日本語**](./README-ja.md) | [English](./README.md)

**aikyoは、相互につながるAIコンパニオンを作成するためのフレームワークです。**

aikyoのDiscordサーバーに参加してください！

<https://discord.gg/JxAVZkQdDX>

## 特徴

- ターンテイキング機能を標準搭載
- 複数コンパニオンでの自然な会話
- [CEL](https://cel.dev) で定義された柔軟なツール使用ルール
- キャラクターの行動をパラメータで定義することによるフロントエンドの拡張性

## インストール

```bash
pnpm i @aikyo/utils @aikyo/server @aikyo/firehose
```

## ライセンス

[MIT License](./LICENSE)

---

## コントリビューション

歓迎します！

### 前提ツール

`pnpm` , `Node.js` (>= 22)

<details><summary>Nix Flakeを使う場合</summary>

`devShell`に入ります。

```bash
nix develop
```

</details>

<details><summary>miseを使う場合</summary>

```bash
mise install
```

</details>

### セットアップ

依存パッケージをインストールします。

```bash
pnpm i
```

`.env` ファイルを作成します。
[ai-sdk](https://ai-sdk.dev/docs/foundations/providers-and-models) がサポートする各プロバイダの API キーを入力します。

```bash
cp .env.example .env
```

### 実行 / 開発ワークフロー

<details><summary>Nix Flakeを使う場合</summary>

パッケージをバンドルします。

```bash
nix run .#bundle
```

firehoseとcompanionを起動します。

```bash
# Usage: nix run .#dev -- <COMPANION> [<COMPANION> ...]
# Example: nix run .#dev -- kyoko aya
$ nix run .#dev
```

</details>

パッケージをバンドルします。

```bash
pnpm run bundle
```

```bash
# 1) firehose サーバーを起動（デフォルト: http://localhost:8080）
$ pnpm run firehose


# 2) コンパニオンを名前指定で起動（利用可能な名前は configs/ ディレクトリを参照）
$ pnpm run companion <companion_name>
```

## 謝辞

aikyoは以下の論文にインスパイアされました:

> **"Who Speaks Next? Multi-party AI Discussion Leveraging the Systematics of Turn-taking in Murder Mystery Games"**  
by Ryota Nonomura and Hiroki Mori (2025)  
📄 [Journal](https://doi.org/10.3389/frai.2025.1582287)

マルチエージェントの対話制御に関する素晴らしい研究に感謝します！
