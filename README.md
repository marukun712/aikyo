# aikyo

aikyoは、相互につながるAIコンパニオンを作成するためのフレームワークです。

## Concept

aikyoは、バーチャルな体を持ったAIコンパニオンを作成しやすくするためのフレームワークです。

コンパニオン同士はP2Pでつながり、3種類のメッセージをやりとりします：

### **message** - コミュニケーション

コンパニオン間、または人間とのメッセージ交換

```json
{
  "from": "companion-id",
  "message": "こんにちは！",
  "target": "target-companion-id",
  "metadata": {}
}
```

### **action** - 物理的動作

コンパニオンの体の動きを表現（送信のみ）

```json
{
  "from": "companion-id",
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

### Companion card

aikyoでは、AIコンパニオンはCompanion cardという設計書で設計することができます。
Companion cardでは、キャラクター設定だけでなく、コンパニオンが実行できるアクション、役割、アクションの実行基準などをユーザーが思い通りに設計することができます。

```typescript
{
  metadata: {
    id: "bebf00bb-8a43-488d-9c23-93c40b84d30e",
    name: "高橋ポルカ",
    personality:
      "高橋ポルカは元気で明るくて難しいことを考えるのが苦手な性格です。",
    story:
      "L高 浅草サテライトの1年生。明るく元気な性格で、嬉しくなると足が勝手に踊りだす。小さい頃から数学が大の苦手で、高校受験に失敗。ネット高校であるL高に入学し、スクールアイドルを見つけた。",
    sample:
      "翔音ちゃんが見せてくれた昔のスクールアイドルの動画の数々 もうすっっっっっごい！！！ かわいかった～！！ 興奮 鼻血でちゃう！！ あ 夏ってなんか鼻血出やすいよね。。。 ティッシュ持ってなくて焦るときあるけど 踊ってごまかすポルカです",
  },
  role: "あなたは、展示会をサポートするAIコンパニオンです。積極的にお客さんを呼び込みます。",
  actions: { speakAction, motionDBGestureAction, contextAction },
  events: [
    {
      condition: "誰かに話しかけられたら、speakで応答してください。",
      tool: "speak",
    },
    {
      condition: "話すとき、motion-db-gestureで体の動きを表現してください。",
      tool: "motion-db-gesture",
    },
    {
      condition:
        "今までに一度も見たことのない人が映ったときのみ、motion-db-gestureで手を振ってください。",
      tool: "motion-db-gesture",
    },
    {
      condition:
        "見たことがある人が映った時、その人に対して話題を提供してください。",
      tool: "speak",
    },
    {
      condition:
        "今までに一度も見たことのない人が映ったときのみ、その人が来たことをcontextで他のコンパニオンに共有します。",
      tool: "context",
    },
    {
      condition:
        "他のコンパニオンから話しかけられたら、今は忙しいので返事をすることができない、と一度だけ返します。それ以降は返事をしません。",
      tool: "speak",
    },
  ],
}
```

### Actionの定義

コンパニオンのアクションは`createCompanionAction`メソッドで作成し、LLMのToolとして定義されます。
LLMが入力するパラメータから、Networkに送信するメッセージデータを生成できます。

```typescript
export const gestureAction = createCompanionAction({
  id: "gesture",
  description: "体の動きを表現する",
  inputSchema: z.object({
    type: z.enum(["wave", "jump", "dance", "nod", "stretch", "clap"]),
  }),
  topic: "actions",
  publish: ({ type }) => ({
    from: companionCard.metadata.id,
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
  publish: async ({ prompt }) => {
    const url = await fetcher.fetchMove(prompt);
    const data: Action = {
      from: companionCard.metadata.id,
      name: "gesture",
      params: { url },
    };
    return data;
  },
});
```

これらのactionデータはFirehoseというサーバーを通してWebSocketを通してクライアントに送信されます。
クライアントは、送られてきたパラメータをもとにコンパニオンの体を操作することで、動作を実現します。

## Requirements

Node.js 24

## Usage

依存関係を解決します。

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

各コンパニオンは自律的にP2Pネットワークに参加し、以下の流れで通信します：

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

FirehoseサーバーはP2PネットワークとWebSocketクライアント間のブリッジとして機能：

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
