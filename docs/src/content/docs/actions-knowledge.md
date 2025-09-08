---
title: アクション＆ナレッジ
description: aikyoにおけるAction（アクション）とKnowledge（ナレッジ）システムの詳細
---

## 概要

aikyoでは、コンパニオンの機能を拡張するために2つの主要なツールシステムを提供しています。

- **Action（アクション）** - コンパニオンが実行できる行動
- **Knowledge（ナレッジ）** - 動的に取得する知識

これらのツールは、Companion Cardに登録することで、LLMが適切なタイミングで自動的に使用します。

## Action（アクション）システム

アクションは、コンパニオンがP2Pネットワークに送信する行動データを定義します。

### 基本的なアクションの作成

```typescript
import { createCompanionAction } from "@aikyo/core";
import { z } from "zod";

export const speakAction = createCompanionAction({
  id: "speak",
  description: "話す。特定のコンパニオンに向けて話したい場合はtargetを指定できます。",
  inputSchema: z.object({
    message: z.string(),
    target: z.string().optional().describe("特定のコンパニオンのIDを指定(任意)"),
    emotion: z
      .enum(["happy", "sad", "angry", "neutral"])
      .describe("あなたの感情に最も適している値を入れてください。"),
  }),
  topic: "messages",
  publish: ({ message, emotion, target }) => ({
    metadata: { emotion },
    from: companionCard.metadata.id,
    message,
    target,
  }),
});
```

### アクションの構成要素

- **id** - アクションの一意識別子
- **description** - LLMがいつ使用すべきかを判断するための説明
- **inputSchema** - Zodスキーマによる入力パラメータの定義
- **topic** - P2P通信で使用するトピック（`messages`, `actions`, `contexts`）
- **publish** - 送信するデータを生成する関数

### トピックの使い分け

#### messages トピック

コンパニオン間、または人間とのメッセージ交換に使用。

#### actions トピック

コンパニオンの物理的動作を表現。

#### contexts トピック

コンパニオン間で状況情報を共有。

### 外部API連携アクション

外部APIと連携するアクションも作成できます。

```typescript
export const motionDBGestureAction = createCompanionAction({
  id: "motion-db-gesture",
  description: "MotionDBからあなたの表現したい動きにあったモーションを取得して再生します。",
  inputSchema: z.object({
    prompt: z.string().describe("promptは必ず英語1,2単語で記述してください。"),
  }),
  topic: "actions",
  publish: async ({ prompt }) => {
    const url = await fetcher.fetch(prompt);
    const data: Action = {
      from: companionCard.metadata.id,
      name: "gesture",
      params: { url },
    };
    return data;
  },
});
```

## Knowledge（ナレッジ）システム

ナレッジは、コンパニオンが動的に外部から知識を取得する機能を定義します。

### 基本的なナレッジの作成

```typescript
import { createCompanionKnowledge } from "@aikyo/core";

export const environmentDBKnowledge = createCompanionKnowledge({
  id: "environment-db",
  description: "あなたの部屋の家具情報などを取得します。",
  inputSchema: z.object({
    label: z.enum(semanticLabels),
  }),
  knowledge: async ({ label }) => {
    const json = await fetcher.fetch(label);
    const data = JSON.stringify(json, null, 2);
    return data;
  },
});
```

### ナレッジの構成要素

- **id** - ナレッジの一意識別子
- **description** - LLMがいつ使用すべきかを判断するための説明
- **inputSchema** - Zodスキーマによる入力パラメータの定義
- **knowledge** - 知識を取得して文字列として返す関数

### ナレッジの特徴

- **ネットワークに送信されない** - アクションとは異なり、ナレッジはP2Pネットワークに送信されません
- **LLMに知識を提供** - 取得した情報は直接LLMのコンテキストに追加されます
- **動的な情報取得** - 外部API、データベース、ファイルシステムなどから情報を取得可能

## Companion Cardへの登録

作成したアクションとナレッジは、Companion Cardに登録して使用します。

```typescript
export const companionCard: CompanionCard = {
  // ... メタデータ、役割
  actions: {
    speakAction,
    gestureAction,
    motionDBGestureAction,
    contextAction,
  },
  knowledge: {
    environmentDBKnowledge,
  },
  // ... イベント定義
};
```
