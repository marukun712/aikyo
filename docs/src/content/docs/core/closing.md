---
title: 会話クロージング
description: aikyoの段階的な会話終了制御システム
---

aikyoでは、AIコンパニオン間の会話を自然に終了させるために**段階的なクロージングシステム**を実装しています。これにより、会話が延々と続くことなく、適切なタイミングで終了できます。

## Closingフィールドの段階

各コンパニオンは`State`生成時に、会話の終了段階を`closing`フィールドで表明します。

```typescript
closing: z
  .enum(["none", "pre-closing", "closing", "terminal"])
  .default("none")
  .describe("会話の収束段階:なし/事前クロージング/クロージング/終端"),
```

### 4つの段階

| 段階 | 意味 | 例 |
|------|------|-----|
| `none` | 会話継続 | 通常の会話中 |
| `pre-closing` | 会話を終わりに向ける布石 | 「そろそろ時間だね」「ところで…」 |
| `closing` | クロージング表現（感謝・挨拶など） | 「話せて楽しかったよ」「ありがとう」 |
| `terminal` | 最後の別れの挨拶 | 「それじゃあね」「またね」 |

## Closingの判断ロジック

### LLMによる自動判断

各コンパニオンは受信したメッセージから会話の文脈を読み取り、適切な`closing`段階を判断します。

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

LLMは会話履歴を参照しながら、自然な終了タイミングを判断します。

### 重複検出との連携

会話が繰り返しになっている場合、強制的にクロージングを促します（詳細は[重複検出](./repetition)を参照）。

```typescript
async generateState(message: Message): Promise<State> {
  ...
  let closingInstruction: string = "";

  if (this.config.enableRepetitionJudge) {
    const formatted = this.history.map((message) => message.params.message);
    const result = await this.repetitionJudge.evaluate(formatted);
    console.log(result);
    const repetition = result.score;
    if (repetition > 0.7) {
      closingInstruction =
        "最重要:会話が繰り返しになっています。直ちにclosingをpre-closing,closing,terminalの順に変えて終了するか、話題を変えてください。";
    }
  }

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
  ...
}
```

重複が検出されると、システムがLLMに対して段階的にクロージングするよう指示します。

## Terminal時の処理

`closing=terminal`の場合、そのコンパニオンは発言を実行しません。

```typescript
private async executeSpeaker(messageId: string, speaker: State) {
...
  const myState = pending.states.find((state) => {
    return (
      state.params.from === this.companionAgent.companion.metadata.id
    );
  });
  if (myState && myState.params.closing === "terminal") {
    console.log("The conversation is over.");
    return;
  }
...
}
```

これにより、クロージングが完了したコンパニオンは新たな発言を行わず、会話が自然に収束します。

## ターン上限による強制終了

オプションで`maxTurn`を設定することで、会話のターン数に上限を設けることができます。

```typescript
// ターン上限が設けられている場合
if (this.config.maxTurn) {
  // 会話が終了したらターンカウントを0に
  if (res.object.closing === "terminal") {
    this.count = 0;
  // ターン上限を超えたら
  } else if (this.count >= this.config.maxTurn) {
    // 強制的に会話終了の意思表示
    res.object.closing = "terminal";
    this.count = 0;
  } else {
    self.count++;
  }
}
```

**使用例:**

```typescript
const companion = new CompanionAgent(
  companionCard,
  anthropic("claude-3-5-haiku-latest"),
  history,
  {
    maxTurn: 10, // 10ターンで強制終了
    enableRepetitionJudge: true
  }
);
```
