# aikyo

## Concept

aikyoは、相互につながるAIコンパニオンを作成するためのフレームワークです。

### Companion Card

aikyoでは、AIコンパニオンはCompanion Cardという設計書で設計することができます。
Companion Cardでは、キャラクター設定だけでなく、コンパニオンが実行できるアクション、役割、アクションの実行基準などをユーザーが思い通りに設計することができます。

LLMに判断させるパラメータを記述し、そのパラメータを使ってツールの実行基準をCELの式として記述することができます。ツールの実行基準は、上に書かれているものが優先されます。
この形式をとることで、ユーザーはCELの式とパラメータを書くだけで、特定の目的に特化したコンパニオンも、汎用的な会話コンパニオンもJSONを編集するだけで手軽に作成することができるようになります。

```typescript
export const companionCard: CompanionCard = {
  metadata: {
    id: "companion_polka",
    url: "http://localhost:4001",
    name: "高橋ポルカ",
    personality:
      "高橋ポルカは元気で明るくて難しいことを考えるのが苦手な性格です。",
    story:
      "L高浅草サテライトの1年生。明るく元気な性格で、嬉しくなると足が勝手に踊りだす。小さい頃から数学が大の苦手で、高校受験に失敗。ネット高校であるL高に入学し、スクールアイドルを見つけた。",
    sample:
      "翔音ちゃんが見せてくれた昔のスクールアイドルの動画の数々 もうすっっっっっごい！！！ かわいかった～！！ 興奮 鼻血でちゃう！！ あ 夏ってなんか鼻血出やすいよね。。。 ティッシュ持ってなくて焦るときあるけど 踊ってごまかすポルカです",
  },
  role: "あなたは、ユーザー、他のコンパニオンと共に生活するコンパニオンです。積極的にコミュニケーションをとりましょう。キャラクター設定に忠実にロールプレイしてください。",
  actions: { motionDBGestureAction, contextAction },
  knowledge: { environmentDBKnowledge, companionNetworkKnowledge },
  events: {
    params: {
      title: "あなたが判断すべきパラメータ",
      description: "descriptionに従い、それぞれ適切に値を代入してください。",
      type: "object",
      properties: {
        need_gesture: {
          description: "ジェスチャーで表現したいものがあるかどうか",
          type: "boolean",
        },
        need_context: {
          description: "周囲に伝えるべき話題があるかどうか。",
          type: "boolean",
        },
      },
      required: ["need_gesture", "need_context"],
    },
    conditions: [
      {
        expression: "need_gesture === true",
        execute: [
          {
            instruction: "ジェスチャーで体の動きを表現する。",
            tool: motionDBGestureAction,
          },
        ],
      },
      {
        expression: "need_context === true",
        execute: [
          {
            instruction:
              "周囲のコンパニオンに今から自分がどんな話題を提供するか、またはどんな話題を話しているかを周知する。",
            tool: contextAction,
          },
        ],
      },
    ],
  },
};
```

### Actionの定義

コンパニオンのアクションは`createCompanionAction`メソッドで作成し、LLMのToolとして定義されます。
LLMが入力するパラメータから、Networkに送信するメッセージデータを生成できます。
Actionツールは、Companion Cardのactionsに登録してください。

```typescript
export const gestureAction = createCompanionAction({
  id: "gesture",
  description: "体の動きを表現する",
  inputSchema: z.object({
    type: z.enum(["wave", "jump", "dance", "nod", "stretch", "clap"]),
  }),
  topic: "actions",
  publish: ({ type }, id) => ({
    from: id,
    name: "gesture",
    params: { type },
  }),
});
```

たとえば、外部のAPIを使用することもできます。

```typescript
export const motionDBGestureAction = createCompanionAction({
  id: "motion-db-gesture",
  description:
    "MotionDBからあなたの表現したい動きにあったモーションを取得して再生します。",
  inputSchema: z.object({
    prompt: z.string().describe("promptは必ず英語1,2単語で記述してください。"),
  }),
  topic: "actions",
  publish: async ({ prompt }, id) => {
    const url = await fetcher.fetch(prompt);
    const data: Action = {
      from: id,
      name: "gesture",
      params: { url },
    };
    return data;
  },
});
```

これらのactionデータはFirehoseというサーバーを通してWebSocketを通してクライアントに送信されます。
クライアントは、送られてきたパラメータをもとにコンパニオンの体を操作することで、動作を実現します。

### Knowledgeの定義

コンパニオンに動的に取得させたい知識は`createCompanionKnowledge`メソッドで作成し、LLMのToolとして定義されます。
LLMが入力するパラメータから、外部のAPIなどを使用して、LLMに知識を与えます。

Knowledgeツールは、LLMに知識を与えるだけで、Networkにデータを送信しません。
Companion Cardのknowledgeに登録することで、適切にシステムプロンプトに埋め込まれます。

```typescript
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

## Requirements

Nix

## Usage

nix-shellに入ります。

```bash
nix-shell
```

パッケージをインストールします。

```bash
npm i
```

バックエンドサーバーを実行します。

```bash
task run
```

コンパニオン名を指定して起動します。

```bash
task companion -- polka
```

### API使用方法

**メッセージ送信**

```http
POST http://localhost:4001/generate
Content-Type: application/json

{
  "from": "user",
  "message": "こんにちは！"
}
```

**コンテキスト追加**

```http
POST http://localhost:4001/context
Content-Type: application/json

{
  "context": "部屋の明かりが暗くなった"
}
```

## 技術的仕様

### P2P通信詳細

**ピア発見・接続**

```typescript
const libp2p = await createLibp2p({
  addresses: { listen: ["/ip4/0.0.0.0/tcp/0"] },
  transports: [tcp()],
  peerDiscovery: [mdns()], // ローカルネットワークでピア探索
  connectionEncrypters: [noise()],
  streamMuxers: [yamux()],
  services: {
    pubsub: gossipsub({ allowPublishToZeroTopicPeers: true }),
    identify: identify({ agentVersion: JSON.stringify(metadata, null, 2) }),
  },
});
```

### メッセージのやりとり

各コンパニオンは、talkToolを用いて、ピア接続時に取得した各コンパニオンのメタデータからurlを解決し、そのurlの/generateに対して、リクエストを送信して、相互に会話します。
会話にGossipsubでなくHTTP APIを採用することで、LLMにツールのレスポンス待ちという概念を与えることができ、自然な会話のキャッチボールを実現しています。

```typescript
export const talkTool = createTool({
  id: "talk",
  inputSchema: z.object({
    to: z
      .string()
      .describe('必ず、送信先コンパニオンの"id"を指定してください。'),
    message: z.string(),
    emotion: z.enum(["neutral", "happy", "sad", "angry"]),
  }),
  description: `他のコンパニオンに話しかけます。`,
  execute: async ({ context, runtimeContext }) => {
.....
```

### Firehose

FirehoseサーバーがP2PネットワークとWebSocketクライアント間のブリッジとして機能します。

```
WebSocket Client ←─→ Firehose Server ←─→ P2P Network
                     (ws://localhost:8080)   (libp2p)
```
