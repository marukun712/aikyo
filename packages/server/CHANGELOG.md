# @aikyo/server

## 1.5.1

### Patch Changes

- f1866a0: logger の path を修正

## 1.5.0

### Minor Changes

- 52c29e6: 会話が並列で展開する問題を修正/誰かが投票しなかった場合会話が止まる問題を修正

## 1.4.6

### Patch Changes

- 4804f37: 不正確な log を修正
- ad58fc9: typo を修正

## 1.4.5

### Patch Changes

- f4da031: closing と state 判定を並列で実行する

## 1.4.4

### Patch Changes

- 5c7aef4: logger を読みやすく

## 1.4.3

### Patch Changes

- da5c332: Closing State を Context に含める

## 1.4.2

### Patch Changes

- 6e972ba: state 集計時にユーザーを含めない

## 1.4.1

### Patch Changes

- eaa303d: コメントを追加

## 1.4.0

### Minor Changes

- 9f674e5: State 生成を分離して会話コンテキストをもたせる

## 1.3.0

### Minor Changes

- 4ef84f4: logger を pino にする

## 1.2.2

### Patch Changes

- bea9cdf: log の数を減らす/libp2p の設定を外部からできるように

## 1.2.1

### Patch Changes

- 58894e7: 循環依存の解決

## 1.2.0

### Minor Changes

- 5105a9f: JSON-RPC に準拠
- 5105a9f: 会話の繰り返し検知機能を追加

### Patch Changes

- Updated dependencies [2386875]
  - @aikyo/utils@1.2.0

## 1.1.1

### Patch Changes

- 97b79c2: db フォルダが存在しない場合に自動的にフォルダを作成するようにした
  - @aikyo/utils@1.1.1

## 1.1.0

### Minor Changes

- d759448: nodejs バージョンを 24 に更新

### Patch Changes

- 305a576: system role としてメッセージを送信できるように
- 20f3f69: Add changeset
- 8651506: デフォルトコンパニオンを変更
- Updated dependencies [20f3f69]
- Updated dependencies [8651506]
- Updated dependencies [d759448]
  - @aikyo/utils@1.1.0
