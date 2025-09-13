# aikyo

aikyoは、相互につながるAIコンパニオンを作成するためのフレームワークです。

## Features

- 発言権ベースのターンテイキングによる自然なコンパニオン同士の対話
- CELによる柔軟なTool使用の定義　
- キャラクターの行動をパラメータで定義することによるフロントエンドの拡張性

## Requirements

Nix

## Usage

nix-shellに入ります。
```bash
nix-shell
```

パッケージをインストールします。
```bash
pnpm i
```

firehoseサーバーを起動します。
```bash
pnpm run firehose
```

コンパニオン名を指定してコンパニオンを起動します。
```bash
pnpm run companion companion_name
```

## License
MIT
