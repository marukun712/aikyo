# aikyo
[**日本語**](./README-ja.md) | [English](./README.md)

aikyo は、相互接続された AI コンパニオンを構築するためのフレームワークです。

## 特長

- 発言権ベースのターンテイキングによる自然なコンパニオン同士の対話
- [CEL](https://cel.dev) で定義された柔軟なツール使用ルール
- キャラクターの行動をパラメータで定義することによるフロントエンドの拡張性

## インストール
```bash
$ pnpm i @aikyo/utils @aikyo/server @aikyo/firehose
```

## ライセンス

[MIT License](./LICENSE)

## コントリビューション

歓迎します～！

### 前提条件

`pnpm` と `Node.js` (>= 22)

<details><summary>nix-shellを使う場合</summary>

先に`nix-shell`に入ります。

```bash
$ nix-shell
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
$ pnpm install
```

`.env` ファイルを用意します。
必要な環境変数は、[ai-sdk](https://ai-sdk.dev/docs/foundations/providers-and-models) がサポートする各プロバイダの API キーです。

```bash
$ cp .env.example .env
```

### 実行 / 開発ワークフロー

```bash
# 1) firehose サーバーを起動（デフォルト: http://localhost:8080）
$ pnpm run firehose


# 2) コンパニオンを名前指定で起動（利用可能な名前は configs/ ディレクトリを参照）
$ pnpm run companion <companion_name>
```
