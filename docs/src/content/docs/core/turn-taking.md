---
title: ターンテイキング
description: aikyoのターンテイキングシステムによる会話順序制御
---

aikyoでは、複数のAIコンパニオンが自然に会話を進めるために**ターンテイキングシステム**を実装しています。このシステムにより、誰がいつ発言するかが自動的に決定されます。

## ターンテイキングの仕組み

### 全体の流れ

1. メッセージを受信したコンパニオンは`State`（状態）を生成
2. 全コンパニオンが`states`トピックに`State`をパブリッシュ
3. `TurnTakingManager`が全員の`State`を収集
4. 投票に基づいて次の発言者を選出
5. 選出されたコンパニオンが発言を実行

## State（状態）の生成

各コンパニオンは受信したメッセージに対して、自分の状態を判断します。

```typescript
async generateState(message: Message): Promise<State> {
 ...

 const statePrompt = `
 以下のメッセージに対するあなたの状態を判断してください。
 ${JSON.stringify(message, null, 2)}

 以下の状態情報をJSON形式で返してください:
 - from: あなたのID
 - messageId: 処理するメッセージのid
 - state: "speak" または "listen" (次に発言したいか、聞く姿勢に入りたいか)
 - importance: 0-10の数値 (会話の文脈におけるあなたが次にしたい発言の重要度)
 - selected: boolean (前回の発言者の発言で、あなたに発言を求められているかどうか)
 - closing ("none", "pre-closing", "closing", "terminal")
   - none: 会話継続
   - pre-closing: 会話を終わりに向ける布石
   - closing: クロージング表現（感謝・挨拶など）
   - terminal: 最後の別れの挨拶

 重要:この判断は、キャラクターとしてではなく、あなたとして今までの会話の文脈を冷静に分析して判断してください。
 ${closingInstruction}
 `;

 const res = await this.agent.generate(statePrompt, {
   runtimeContext: this.runtimeContext,
   output: StateBody,
   resourceId: "main",
   threadId: "thread",
 });

 ...

 return { jsonrpc: "2.0", method: "state.send", params: res.object };
}
```

### Stateの構造

```typescript
export const StateBody = z.object({
  id: z.string(),
  from: z.string(),
  messageId: z.string().describe("このstateが対応する元のメッセージのID"),
  state: z
    .enum(["speak", "listen"])
    .describe("次に発言をしたいか、聞く姿勢に入りたいか"),
  importance: z
    .number()
    .min(0)
    .max(10)
    .describe("会話の文脈におけるあなたが次にしたい発言の重要度"),
  selected: z
    .boolean()
    .describe("前回の発言者の発言で、あなたに発言を求められているかどうか"),
  closing: z
    .enum(["none", "pre-closing", "closing", "terminal"])
    .default("none")
    .describe("会話の収束段階:なし/事前クロージング/クロージング/終端"),
});
```

**重要なフィールド:**

- **state**: `speak`（発言したい）か`listen`（聞く姿勢）
- **importance**: 0-10のスコア（高いほど優先される）
- **selected**: 名指しされているかどうか
- **closing**: 会話終了の意思（詳細は[会話クロージング](./closing)を参照）

## TurnTakingManagerによる発言者選出

`TurnTakingManager`は全コンパニオンの`State`を収集し、発言者を決定します。

### State収集

```typescript
async handleStateReceived(state: State) {
  const messageId = state.params.messageId;
  if (!this.pending.has(messageId)) {
    return;
  }
  const pending = this.pending.get(messageId);
  if (!pending) return;
  pending.states.push(state);
  const voted = new Set<string>();
  pending.states.forEach((state) => {
    voted.add(state.params.from);
  });
  //参加者全員の投票が集まった場合
  if (setsAreEqual(voted, pending.participants)) {
    await this.decideNextSpeaker(messageId, pending.states);
  }
}
```

### 発言者選出

```typescript
private async decideNextSpeaker(messageId: string, states: State[]) {
  const selectedAgents = states.filter((state) => state.params.selected);
  if (selectedAgents.length > 0) {
    const speaker = selectedAgents.reduce((prev, current) =>
      prev.params.importance > current.params.importance ? prev : current,
    );
    await this.executeSpeaker(messageId, speaker);
    return;
  }
  const speakAgents = states.filter(
    (state) => state.params.state === "speak",
  );
  if (speakAgents.length > 0) {
    const speaker = speakAgents.reduce((prev, current) =>
      prev.params.importance > current.params.importance ? prev : current,
    );
    await this.executeSpeaker(messageId, speaker);
    return;
  }
  this.pending.delete(messageId);
}
```

**優先順位:**

1. **名指しされたコンパニオン (`selected=true`)**: その中で最高`importance`
2. **発言希望コンパニオン (`state=speak`)**: その中で最高`importance`
3. **該当なし**: 発言者なしで終了

### 発言実行

選出されたコンパニオンが自分である場合、発言を実行します。

```typescript
private async executeSpeaker(messageId: string, speaker: State) {
 logger.info(
   {
     from: speaker.params.from,
     importance: speaker.params.importance,
   },
   "Speaker selected",
 );
 if (speaker.params.from === this.companionAgent.companion.metadata.id) {
   try {
     const pending = this.pending.get(messageId);
     if (pending) {
       const myState = pending.states.find((state) => {
         return (
           state.params.from === this.companionAgent.companion.metadata.id
         );
       });
       if (myState && myState.params.closing === "terminal") {
         logger.info("The conversation is over");
         return;
       }
       await new Promise<void>((resolve) => {
         setTimeout(() => {
           resolve();
         }, this.timeoutDuration);
       });
       await this.companionAgent.input(pending.message);
     } else {
       logger.warn(
         { messageId },
         "Original message not found for messageId",
       );
     }
   } catch (error) {
     logger.error({ error }, "Failed to execute speaker logic");
   }
 }
 this.pending.delete(messageId);
}
```

