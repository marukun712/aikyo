---
title: コンパニオンカード
description: Companion Cardを使ったAIコンパニオンの設計方法
---

## Companion Cardとは

Companion Card（コンパニオンカード）は、AIコンパニオンの設計書となる設定オブジェクトです。キャラクターの基本設定から、実行可能なツール（アクションやナレッジ）、さらには自律的な判断基準まで、コンパニオンのあらゆる側面を定義します。

## Companion Cardの構成要素

`CompanionCard`オブジェクトは、主に5つの要素で構成されます。

### 1. メタデータ（metadata）

コンパニオンの基本的なプロフィールを定義します。

```typescript
metadata: {
  id: "companion_aya",
  name: "aya",
  personality:
    "落ち着いていてクールな雰囲気を持つが、時折ほんの少し抜けていて親しみやすい一面を見せる。プログラミングや分散システムの話になると饒舌になり、楽しそうに語る姿が可愛らしい。基本的には理知的で真面目だが、意外と感情表現が豊か。",
  story:
    "p2pネットワークや分散システムに強い関心を持ち、独自の研究や開発を続けている。自由なスタイルでプロジェクトをこなしながら、理想的な分散型の未来を夢見ている。普段はクールで冷静だが、技術の話になると目を輝かせる。",
  sample:
    "『分散システムって、みんなで支え合って動いてる感じが好きなんだ。…ちょっと可愛いと思わない？』",
},
```

- `id`: コンパニオンの一意識別子（`companion_`で始まる必要があります）
- `name`: コンパニオンの名前
- `personality`: 性格設定。LLMがキャラクターを演じる上での指針となります。
- `story`: コンパニオンの背景ストーリー
- `sample`: 話し方のサンプル

### 2. 役割（role）

コンパニオンが対話の中で担うべき、より具体的な役割を定義します。

```typescript
role: "あなたは、ユーザー、他のコンパニオンと共に生活するコンパニオンです。積極的にコミュニケーションをとりましょう。キャラクター設定に忠実にロールプレイしてください。",
```

### 3. アクション（actions）

コンパニオンが実行できる「行動」のセットを定義します。ここで登録したアクションが、LLMが利用可能なツールとなります。

```typescript
actions: {
  speakAction,       // 会話するアクション
  gestureAction,     // ジェスチャーをするアクション
}
```

### 4. ナレッジ（knowledge）

コンパニオンが動的に取得できる「知識」のセットを定義します。これもLLMが利用可能なツールの一種です。

```typescript
knowledge: {
  companionNetworkKnowledge, // ネットワーク情報を取得するナレッジ
}
```

### 5. イベント（events）

コンパニオンが自律的に判断し、アクションを実行するためのルールを定義します。

## イベントシステム

イベントシステムは、LLMが状況を判断するためのパラメータ定義（`params`）と、その判断結果に基づいてツールを実行する条件分岐（`conditions`）から構成されます。

### パラメータ定義 (`params`)

対話の履歴などを受け、LLMが各状況で判断すべき項目をJSON Schema形式で定義します。

```typescript
events: {
  params: {
    title: "あなたが判断すべきパラメータ",
    description: "descriptionに従い、それぞれ適切に値を代入してください。",
    type: "object",
    properties: {
      already_replied: {
        description: "すでに話したことのある人かどうか",
        type: "boolean",
      },
      need_response: {
        description: "返答の必要があるかどうか",
        type: "boolean",
      },
    },
    required: ["already_replied", "need_response"],
  },
  // ... conditionsが続く
}
```

### 条件分岐とアクション実行 (`conditions`)

`params`での判断結果を元に、CEL（Common Expression Language）式で条件を記述し、条件に一致した場合に実行するツールと指示（`instruction`）を定義します。

```typescript
conditions: [
  {
    expression: "already_replied == false",
    execute: [
      {
        instruction: "自己紹介をする。",
        tool: speakTool,
      },
    ],
  },
  {
    expression: "need_response == true",
    execute: [
      {
        instruction: "ツールを使って返信する。",
        tool: speakTool,
      },
    ],
  },
],
```

#### 実行順序

`conditions` 配列は**上から順に評価**され、最初に`expression`が真（true）と評価されたブロックの`execute`が実行されます。そのため、より具体的で優先度の高い条件を配列の上に配置することが重要です。

#### CELの文法

CELの文法については、公式の言語定義を参照してください。

[CEL Language Definition](https://github.com/google/cel-spec/blob/master/doc/langdef.md)
