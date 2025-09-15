# aikyo
[**日本語**](./README-ja.md) | [English](./README.md)

aikyoは、相互につながるAIコンパニオンを作成するためのフレームワークです。 

## 特長

- ターンテイキング機能を標準搭載
- 複数コンパニオンでの自然な会話
- [CEL](https://cel.dev) で定義された柔軟なツール使用ルール
- キャラクターの行動をパラメータで定義することによるフロントエンドの拡張性

## インストール
```bash
$ pnpm i @aikyo/utils @aikyo/server @aikyo/firehose
```

## ライセンス

[MIT License](./LICENSE)

## コントリビューション

歓迎します！

### Requirements

`pnpm` , `Node.js` (>= 22)

<details><summary>Nix Flakeを使う場合</summary>

`devShell`に入ります。

```bash
$ nix develop
```

</details>

<details><summary>miseを使う場合</summary>


```bash
$ mise install
```

</details>

### セットアップ

依存パッケージをインストールします。

```bash
$ pnpm i
```

`.env` ファイルを作成します。
[ai-sdk](https://ai-sdk.dev/docs/foundations/providers-and-models) がサポートする各プロバイダの API キーを入力します。

```bash
$ cp .env.example .env
```

### 実行 / 開発ワークフロー
<details><summary>Nix Flakeを使う場合</summary>

firehoseとcompanionを起動します。
```bash
# Usage: nix run .#dev -- <COMPANION> [<COMPANION> ...]
# Example: nix run .#dev -- kyoko aya
$ nix run .#dev
```

</details>

```bash
# 1) firehose サーバーを起動（デフォルト: http://localhost:8080）
$ pnpm run firehose


# 2) コンパニオンを名前指定で起動（利用可能な名前は configs/ ディレクトリを参照）
$ pnpm run companion <companion_name>
```
