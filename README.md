# aikyo

aikyoは、相互につながるAIコンパニオンを作成するためのフレームワークです。

## Concept

aikyoは、バーチャルな体を持ったAIコンパニオンを作成しやすくするためのフレームワークです。

コンパニオン同士はP2Pでつながり、3種類のメッセージをやりとりします。

### **message** - コミュニケーション

コンパニオン間、または人間とのメッセージ交換

```json
{
  "from": "id",
  "message": "こんにちは！",
  "target": "target-companion-id",
  "metadata": {}
}
```

コンパニオンのidはcompanion_xxxx、ユーザーのidはuser_xxxxである必要があります。

### **action** - 物理的動作

コンパニオンの体の動きを表現（送信のみ）

```json
{
  "from": "id",
  "name": "action-name",
  "params": {
    Custom action params....
  },
  "metadata": {}
}
```

### **context** - 共通認識

コンパニオン間で共有する状況情報

```json
{
  "type": "text",
  "context": "部屋の明かりが暗くなった"
}
```

### Companion Card

aikyoでは、AIコンパニオンはCompanion Cardという設計書で設計することができます。
Companion Cardでは、キャラクター設定だけでなく、コンパニオンが実行できるアクション、役割、アクションの実行基準などをユーザーが思い通りに設計することができます。

```typescript
export const companionCard: CompanionCard = {
  metadata: {
    id: "companion_polka",
    name: "高橋ポルカ",
    personality:
      "高橋ポルカは元気で明るくて難しいことを考えるのが苦手な性格です。",
    story:
      "L高 浅草サテライトの1年生。明るく元気な性格で、嬉しくなると足が勝手に踊りだす。小さい頃から数学が大の苦手で、高校受験に失敗。ネット高校であるL高に入学し、スクールアイドルを見つけた。",
    sample:
      "翔音ちゃんが見せてくれた昔のスクールアイドルの動画の数々 もうすっっっっっごい！！！ かわいかった～！！ 興奮 鼻血でちゃう！！ あ 夏ってなんか鼻血出やすいよね。。。 ティッシュ持ってなくて焦るときあるけど 踊ってごまかすポルカです",
  },
  role: "あなたは、ユーザー、他のコンパニオンと共に生活するコンパニオンです。積極的にコミュニケーションをとりましょう。",
  actions: { speakAction, motionDBGestureAction, contextAction },
  knowledge: { environmentDBKnowledge },
  events: {
    params: {
      title: "あなたが判断すべきパラメータ",
      description: "descriptionに従い、それぞれ適切に値を代入してください。",
      type: "object",
      properties: {
        need_reply: {
          description:
            "相手のメッセージに対する返答(true)か、自分から話しかけている(false)か",
          type: "boolean",
        },
        already_replied: {
          description:
            "交流してきたコンパニオン/ユーザーと会話をしたことがあるか",
          type: "boolean",
        },
        already_seen: {
          description: "交流してきたコンパニオン/ユーザーを、見たことがあるか",
          type: "boolean",
        },
        need_gesture: {
          description: "ジェスチャーで表現したいものがあるかどうか",
          type: "boolean",
        },
        need_context: {
          description: "他のコンパニオンに共有すべき情報があるか",
          type: "boolean",
        },
      },
      required: [
        "need_reply",
        "already_replied",
        "already_seen",
        "need_gesture",
        "need_context",
      ],
    },
    conditions: [
      {
        expression: "need_reply === true",
        execute: [
          {
            instruction: "応答する。",
            tool: speakAction,
          },
        ],
      },
      {
        expression: "already_seen === true",
        execute: [
          {
            instruction: "見たことのある人が交流してきたので、話題を提供する",
            tool: speakAction,
          },
        ],
      },
      {
        expression: "already_seen === false",
        execute: [
          {
            instruction: "見たことのない人が交流してきたので、手を振る",
            tool: motionDBGestureAction,
          },
          { instruction: "見たことのない人に、挨拶をする", tool: speakAction },
          {
            instruction: "他のコンパニオンに、初めて見る人の情報を共有する",
            tool: contextAction,
          },
        ],
      },
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
            instruction: "コンパニオンに情報を共有する。",
            tool: contextAction,
          },
        ],
      },
      {
        expression: "need_reply === false",
        execute: [
          {
            instruction: "独り言を言う。",
            tool: contextAction,
          },
        ],
      },
    ],
  },
};
```

LLMに判断させるパラメータを記述し、そのパラメータを使ってツールの実行基準をCELの式として記述することができます。ツールの実行基準は、上に書かれているものが優先されます。

この形式をとることで、ユーザーはCELの式とパラメータを書くだけで、特定の目的に特化したコンパニオンも、汎用的な会話コンパニオンもJSONを編集するだけで手軽に作成することができるようになります。

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

Node.js 24

## Usage

パッケージをインストールします。

```
npm i
```

configs/にあるフォルダを指定して起動します。

```
npm run companion --config=polka
```

firehose を起動します。

```
npm run firehose
```

firehoseに対してmessage、contextなどをsendすることで、P2Pネットワークにメッセージを流すことができます。

```json
{
  "from": "user_xxxx",
  "message": "こんにちは！",
  "target": "target-companion-id",
  "metadata": {}
}
```

以下のリクエストをコンパニオンサーバーに投げることで、特定のコンパニオンにcontextを与えることができます。

```http
POST /context
Content-Type: application/json

{
  "type": "image" | "text",
  "context": "string"
}
```

## 技術的仕様

### P2P通信アーキテクチャ

aikyoはGossipSubを使用してコンパニオン間の分散通信を実現します。

#### ネットワーク構成

```
Companion A ←--→ Companion B
    ↓              ↓
    P2P Network (libp2p)
    ↓              ↓
Companion C ←--→ Companion D
```

各コンパニオンは自律的にP2Pネットワークに参加し、以下の流れで通信します。

1. **ピア発見**: mDNSでローカルネットワーク内の他コンパニオンを発見
2. **接続確立**: 接続を確立
3. **Pub/Sub参加**: GossipSubで以下トピックに自動参加
   - `messages`: コンパニオン間メッセージ
   - `actions`: 物理的動作データ
   - `contexts`: 共有状況情報

#### P2P通信の詳細実装

**ピア発見・接続**

```typescript
// core/lib/server/index.ts:39-55
const libp2p = await createLibp2p({
  addresses: { listen: ["/ip4/0.0.0.0/tcp/0"] },
  transports: [tcp()],
  peerDiscovery: [mdns()], // ローカルネットワークでピア探索
  connectionEncrypters: [noise()],
  streamMuxers: [yamux()],
  services: {
    pubsub: gossipsub({ allowPublishToZeroTopicPeers: true }),
    identify: identify(),
  },
});

// 新しいピアを発見したら自動接続
libp2p.addEventListener("peer:discovery", (evt) => {
  libp2p.dial(evt.detail.multiaddrs);
});
```

**メッセージ配信**

```typescript
// Pub/Subトピックに自動参加
libp2p.services.pubsub.subscribe("messages");
libp2p.services.pubsub.subscribe("actions");
libp2p.services.pubsub.subscribe("contexts");

// メッセージ受信処理
libp2p.services.pubsub.addEventListener("message", (evt) => {
  const data = JSON.parse(new TextDecoder().decode(evt.detail.data));
  // トピック別に処理を分岐
});
```

#### Firehose統合

FirehoseサーバーはP2PネットワークとWebSocketクライアント間のブリッジとして機能します。

```
WebSocket Client ←--→ Firehose Server ←--→ P2P Network
                      (WebSocket)          (libp2p)
```

**Firehoseの役割**

1. WebSocketクライアントからのメッセージをP2Pネットワークに中継
2. P2Pネットワークのメッセージを全WebSocketクライアントに配信
3. クライアントがP2P技術を直接実装する必要性を排除

```typescript
// firehose/index.ts:62-72
libp2p.services.pubsub.addEventListener("message", async (message) => {
  const data = JSON.parse(new TextDecoder().decode(message.detail.data));

  // 全WebSocketクライアントに配信
  const payload = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(payload);
    }
  }
});
```

## Examples

aikyoをバックエンドとしたモバイルAIコンパニオン

https://github.com/MRTalk-dev/Mobile-Companion
