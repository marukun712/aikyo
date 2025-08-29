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

## Configuration

### Port Configuration

aikyoは動的ポート割り当てをサポートしており、ポート競合を自動的に解決します。

#### デフォルトポート

- Polka: 4000
- Mai: 4001  
- Hanabi: 4002
- Firehose: 8080

#### 環境変数でのポート設定

`.env`ファイルまたは環境変数でポートを設定できます：

```bash
POLKA_PORT=5000
MAI_PORT=5001
HANABI_PORT=5002
FIREHOSE_PORT=8080
```

#### 動的ポート割り当て

指定されたポートが使用中の場合、システムは自動的に次の利用可能なポートを検索します：

```bash
npm run companion --config=polka
# もしポート4000が使用中の場合：
# "Preferred port 4000 is not available, using port 4001 instead"
# "Character server running on http://localhost:4001"
```

複数のコンパニオンを同時に起動する場合、ポート競合が自動的に解決されます。

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
