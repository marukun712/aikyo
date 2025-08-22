---
title: コンパニオンカード
description: Companion Cardを使ったAIコンパニオンの設計方法
---

## Companion Cardとは

Companion Card（コンパニオンカード）は、AIコンパニオンの設計書となるJSONベースの設定ファイルです。キャラクター設定だけでなく、コンパニオンが実行できるアクション、役割、アクションの実行基準などをユーザーが思い通りに設計することができます。

## Companion Cardの構成要素

### 1. メタデータ（metadata）

コンパニオンの基本情報を定義します。

```typescript
metadata: {
  id: "companion_bebf00bb-8a43-488d-9c23-93c40b84d30e",
  name: "高橋ポルカ",
  personality: "元気で明るくて難しいことを考えるのが苦手な性格です。",
  story: "L高 浅草サテライトの1年生。明るく元気な性格で...",
  sample: "翔音ちゃんが見せてくれた昔のスクールアイドルの動画..."
}
```

- **id** - コンパニオンの一意識別子（`companion_`で始まる必要があります）
- **name** - コンパニオンの名前
- **personality** - 性格設定
- **story** - 背景ストーリー
- **sample** - 話し方のサンプル

### 2. 役割（role）

コンパニオンの基本的な役割を定義します。

```typescript
role: "あなたは、展示会をサポートするAIコンパニオンです。積極的にお客さんを呼び込みます。";
```

### 3. アクション（actions）

コンパニオンが実行できる行動を定義します。

```typescript
actions: {
  speakAction,
  motionDBGestureAction,
  contextAction,
}
```

### 4. ナレッジ（knowledge）

動的に取得する知識を定義します：

```typescript
knowledge: {
  environmentDBKnowledge;
}
```

### 5. イベント（events）

コンパニオンの判断基準とアクション実行条件を定義します。

## イベントシステム

イベントシステムは、LLMが判断するパラメータと、それに基づく条件分岐から構成されます。

### パラメータ定義

LLMが各状況で判断すべきパラメータを定義します。

```typescript
events: {
  params: {
    title: "あなたが判断すべきパラメータ",
    description: "descriptionに従い、それぞれ適切に値を代入してください。",
    type: "object",
    properties: {
      interaction_type: {
        description: "交流してきた人がコンパニオンか、ユーザーか",
        enum: ["user", "companion"],
        type: "string"
      },
      already_replied: {
        description: "交流してきたコンパニオン/ユーザーに、返事をしたことがあるか",
        type: "boolean"
      },
      need_reply: {
        description: "返事が必要かどうか",
        type: "boolean"
      }
    },
    required: ["interaction_type", "already_seen"]
  }
}
```

### 条件分岐とアクション実行

CEL（Common Expression Language）式を使用して条件分岐を記述し、条件に応じてツールを実行します。

```typescript
conditions: [
  {
    expression: 'interaction_type === "user" && need_reply === true',
    execute: [
      {
        instruction: "応答する。",
        tool: speakAction,
      },
    ],
  },
  {
    expression: 'interaction_type === "user" && already_seen === false',
    execute: [
      {
        instruction: "見たことのない人が交流してきたので、手を振る",
        tool: motionDBGestureAction,
      },
      {
        instruction: "見たことのない人に、挨拶をする",
        tool: speakAction,
      },
      {
        instruction: "他のコンパニオンに、初めて見る人の情報を共有する",
        tool: contextAction,
      },
    ],
  },
];
```

## CELの記述

CELの文法については、以下のドキュメントを参照してください。

https://github.com/google/cel-spec/blob/master/doc/langdef.md

## 実行順序

条件分岐は**上から順に評価**され、条件に一致した場合にアクションが実行されます。より具体的な条件を上に配置し、一般的な条件を下に配置することが重要です。
