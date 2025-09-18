---
title: フレームワーク概要
description: aikyoフレームワークの全体像と主要な概念について
---

## aikyoとは

aikyoは、相互につながるAIコンパニオンを作成するためのフレームワークです。P2Pネットワークを通じて自律的にコミュニケーションを行うAIたちが、単に応答するだけでなく、自然な会話の流れを形成するための仕組みを提供します。

## アーキテクチャ概要

aikyoは以下の主要コンポーネントで構成されています。

### コア要素

- **Companion Card**: AIコンパニオンの設計書
- **Conversation Manager**: 会話の進行を管理（ターンテイキングとクロージング）
- **P2P Network**: libp2pを使用した分散通信基盤
- **Firehose Server**: WebSocketブリッジサーバー
- **Action & Knowledge System**: コンパニオンの行動や知識の拡張機能

## 主要なデータタイプ

aikyoのP2Pネットワークでは、主に以下のデータがやり取りされます。

### 1. Message

コンパニオン間、またはユーザーとの会話に使われる基本的なメッセージです。

```json
{
  "id": "...",
  "from": "user_alice",
  "to": ["companion_xxxx"],
  "message": "こんにちは！"
}
```

### 2. Action

コンパニオンの物理的な動きや、クライアント側で解釈・実行されるべき行動を表現します。

```json
{
  "from": "companion_xxxx",
  "name": "gesture",
  "params": {
    "type": "wave"
  }
}
```

### 3. State

会話の中で、各コンパニオンが次に話したいか、聞きたいかといった状態を表明するためのデータです。これにより、会話のターン制御を実現します。

### 4. Query / QueryResult

コンパニオンがクライアントアプリケーションに情報を要求したり、その結果を返したりするために使用します。

## Companion Card

AIコンパニオンの設計書となる設定ファイルです。以下の要素を定義できます。

- **メタデータ** - ID、名前、性格、ストーリー
- **役割（Role）** - コンパニオンの基本的な役割定義
- **アクション** - 実行可能な行動の定義
- **ナレッジ** - 動的に取得する知識の定義
- **イベント** - 条件分岐とツール実行の定義

### イベントシステム

Companion Cardでは、CEL（Common Expression Language）を使用した条件分岐システムを提供しています。

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
}
```

## 会話制御システム (Turn-Taking & Closing)

`aikyo`の際立った特徴の一つが、複数のコンパニオンが参加する会話を自律的に制御するシステムです。これにより、AIたちが互いに発言を遮ったり、延々と会話を続けてしまったりすることを防ぎ、より人間らしい自然な対話を実現します。

このシステムは主に「ターンテイキング」と「クロージング」の2つの仕組みで構成されています。

### 1. ターンテイキング (Turn-Taking)

誰が次に話すかを決定する仕組みです。これにより、発言の衝突を回避します。

1.  あるコンパニオンがメッセージを発信すると、それを受け取った他のコンパニオンたちは、自分が次に「話したい(`speak`)」か「聞きたい(`listen`)」かを判断します。
2.  各コンパニオンは、その意思を`State`というデータでP2Pネットワークに送信します。
3.  フレームワーク内部の`TurnTakingManager`が、全員の`State`を集計します。
4.  `TurnTakingManager`は、発言の重要度（`importance`）などを考慮し、次に話すコンパニオンを1体だけ選出します。選ばれたコンパニオンだけが、次の発言権を得ます。

### 2. クロージング (Closing)

会話の終わりを自然に導くための仕組みです。

- 各コンパニオンは、会話が収束に向かっているかを判断し、`State`内の`closing`フラグ（`pre-closing`, `closing`など）を立てます。
- 全員の`closing`状態が一定の条件を満たすと、`TurnTakingManager`は会話が終了したと判断し、コンパニオンたちは新たな対話を待つ状態に戻ります。

これらの会話制御はフレームワークレベルで提供されるため、開発者は複雑なロジックを実装することなく、複数のコンパニオンによる自然なグループ対話の恩恵を受けることができます。

## ツールシステム

### Action（アクション）

コンパニオンがP2Pネットワークに特定のデータを送信する行動を定義します。

```typescript
export const speakTool = createCompanionAction({
  id: "speak",
  description: "発言する。",
  inputSchema: z.object({
    message: z.string(),
    to: z
      .array(z.string())
      .describe(
        "このメッセージの宛先。必ずコンパニオンのidを指定してください。特定のコンパニオンに個人的に話しかけたいとき以外は、必ず、会話に参加したことのある全員を含むようにしてください。また、積極的にuserに会話を振ってください。",
      ),
    emotion: z.enum(["happy", "sad", "angry", "neutral"]),
  }),
  topic: "messages",
  publish: ({ input, id }) => {
    return {
      id: crypto.randomUUID(),
      from: id,
      to: input.to,
      message: input.message,
      metadata: { emotion: input.emotion },
    };
  },
});
```

### Knowledge（ナレッジ）

外部APIやデータベースから動的に知識を取得し、LLMの判断材料とする機能を定義します。

```typescript
export const companionNetworkKnowledge = createCompanionKnowledge({
  id: "companions-network",
  description:
    "同じネットワークに所属しているコンパニオンのリストを取得します。",
  inputSchema: z.object({}),
  outputSchema: z.string(),
  knowledge: async ({ companions }) =>
    Array.from(companions.entries())
      .map((metadata) => JSON.stringify(metadata, null, 2))
      .join("\n"),
});
```
