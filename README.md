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

## Examples

aikyoをバックエンドとしたモバイルAIコンパニオン

https://github.com/MRTalk-dev/Mobile-Companion
