---
title: アクション＆ナレッジ
description: aikyoにおけるAction（アクション）とKnowledge（ナレッジ）システムの詳細
---

## 概要

aikyoでは、コンパニオンの機能を拡張するために2つの主要なツールシステムを提供しています。

- **Action（アクション）**: コンパニオンがP2Pネットワークにデータを送信する行動
- **Knowledge（ナレッジ）**: LLMが判断するために動的に取得する知識

これらのツールは、Companion Cardに登録することで、LLMが適切なタイミングで自動的に使用します。

## Actionシステム

アクションは、コンパニオンがP2Pネットワークに送信する`Message`や`Action`といったデータ構造を定義します。

### 基本的なアクションの作成

`createCompanionAction`ファクトリ関数を使ってアクションを作成します。

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

### アクションの構成要素

- `id`: アクションの一意識別子
- `description`: LLMがいつ使用すべきかを判断するための説明
- `inputSchema`: Zodスキーマによる入力パラメータの定義
- `topic`: P2P通信で使用するトピック (`messages` または `actions`)
- `publish`: 送信するデータを生成する関数。引数として`input`（LLMが生成したパラメータ）や`id`（コンパニオン自身のID）などを受け取ります。

### トピックの使い分け

- **messages**: コンパニオン間の会話や、ユーザーとの対話に使用します。
- **actions**: ジェスチャーなど、クライアント側で解釈される物理的な動作の表現に使用します。

## Knowledgeシステム

ナレッジは、コンパニオンが動的に外部から知識を取得し、LLMの判断材料とする機能を定義します。

### 基本的なナレッジの作成

`createCompanionKnowledge`ファクトリ関数を使ってナレッジを作成します。

```typescript
export const companionNetworkKnowledge = createCompanionKnowledge({
  id: "companions-network",
  description:
    "同じネットワークに所属しているコンパニオンのリストを取得します。",
  inputSchema: z.object({}),
  outputSchema: z.string(),
  knowledge: async ({ companions }) =>
  //companionsには、接続されているコンパニオンのMap<string,Metadata>が入る
    Array.from(companions.entries())
      .map((metadata) => JSON.stringify(metadata, null, 2))
      .join("\n"),
});
```

### ナレッジの構成要素

- `id`: ナレッジの一意識別子
- `description`: LLMがいつ使用すべきかを判断するための説明
- `inputSchema`: Zodスキーマによる入力パラメータの定義
- `outputSchema`: Zodスキーマによる出力形式の定義
- `knowledge`: 知識を生成する関数。引数として`input`や`companions`（ネットワーク上のコンパニオン一覧）などを受け取り、`outputSchema`に沿った形式の文字列やオブジェクトを返します。

### ナレッジの特徴

- **ネットワークに送信されない**: アクションとは異なり、ナレッジの実行結果はP2Pネットワークには送信されません。
- **LLMに知識を提供**: 取得した情報は直接LLMのコンテキストに追加され、次の思考の材料となります。
- **動的な情報取得**: 外部API、データベース、ファイルシステム、さらにはP2Pネットワークの状態など、様々なソースから情報を取得できます。

## Companion Cardへの登録

作成したアクションとナレッジは、Companion Cardの`actions`および`knowledge`フィールドに登録して使用します。

```typescript
export const companionCard: CompanionCard = {
  // ... メタデータ、役割
  actions: {
    speakAction,
    // ... その他のアクション
  },
  knowledge: {
    companionNetworkKnowledge,
    // ... その他のナレッジ
  },
  // ... イベント定義
};
```
