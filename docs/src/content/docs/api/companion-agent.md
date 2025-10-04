---
title: CompanionAgent
description: CompanionAgentクラスのAPIリファレンス
---

`CompanionAgent`は、AIコンパニオンのコアロジックを管理するクラスです。エージェント、メモリ、ワークフロー、重複検出を統合し、メッセージ処理と状態生成を行います。

## インポート

```typescript
import { CompanionAgent } from "@aikyo/server";
```

## コンストラクタ

```typescript
constructor(
  companion: CompanionCard,
  model: LanguageModel,
  history: Message[],
  config?: { maxTurn: number | null; enableRepetitionJudge: boolean }
)
```

### パラメータ

| パラメータ | 型 | 説明 | デフォルト |
|-----------|-----|------|-----------|
| `companion` | `CompanionCard` | コンパニオンの設定（メタデータ、ツール、イベントなど） | - |
| `model` | `LanguageModel` | 使用するLLMモデル（`@ai-sdk/*`から取得） | - |
| `history` | `Message[]` | 会話履歴の配列（参照渡し） | - |
| `config` | `object` | オプション設定 | `{ maxTurn: null, enableRepetitionJudge: true }` |
| `config.maxTurn` | `number \| null` | 最大ターン数（超えると強制終了） | `null`（制限なし） |
| `config.enableRepetitionJudge` | `boolean` | 重複検出の有効/無効 | `true` |

### 使用例

```typescript
import { CompanionAgent } from "@aikyo/server";
import { anthropic } from "@ai-sdk/anthropic";
import type { Message } from "@aikyo/server";

const history: Message[] = [];

const companion = new CompanionAgent(
  companionCard,
  anthropic("claude-3-5-haiku-latest"),
  history,
  {
    maxTurn: 20,                    // 20ターンで強制終了
    enableRepetitionJudge: true     // 重複検出を有効化
  }
);
```

**動作確認済みLLMプロバイダー**

- **Anthropic**: `@ai-sdk/anthropic`
- **Google**: `@ai-sdk/google`

## プロパティ

### companion

```typescript
companion: CompanionCard
```

コンパニオンの設定カード。

### agent

```typescript
agent: Agent
```

Mastra Agentのインスタンス。LLMとの対話を管理します。

### repetitionJudge

```typescript
repetitionJudge: RepetitionJudge
```

会話の重複を検出するジャッジ。詳細は[重複検出](../core/repetition)を参照。

### history

```typescript
history: Message[]
```

会話履歴の配列（参照）。

### memory

```typescript
memory: Memory
```

長期記憶とワーキングメモリを管理する`Memory`インスタンス。

```typescript
this.memory = new Memory({
  storage: new LibSQLStore({
    url: `file:db/${this.companion.metadata.id}.db`,
  }),
  vector: new LibSQLVector({
    connectionUrl: `file:db/${this.companion.metadata.id}.db`,
  }),
  options: {
    workingMemory: { enabled: true, schema: MemorySchema },
  },
});
```

**永続化:**

- `db/<companion_id>.db`にLibSQLデータベースを作成
- ベクトルストアによる類似検索が可能

**ワーキングメモリスキーマ:**

```typescript
export const MemorySchema = z.object({
  messages: z.array(
    z.object({
      from: z.string().describe("メッセージを送信したコンパニオンのid"),
      content: z.string().describe("メッセージ内容を要約したもの"),
    }),
  ),
});
```

### runtimeContext

```typescript
runtimeContext: RuntimeContext
```

ツール実行時に参照されるランタイムコンテキスト。以下の情報が格納されます:

```typescript
this.runtimeContext.set("id", companion.metadata.id);

this.companionAgent.runtimeContext.set("libp2p", this.libp2p);
this.companionAgent.runtimeContext.set("companions", this.companionList);
this.companionAgent.runtimeContext.set("pendingQueries", this.pendingQueries);
this.companionAgent.runtimeContext.set("agent", this.companionAgent);
```

| キー | 型 | 説明 |
|------|-----|------|
| `id` | `string` | コンパニオンのID |
| `libp2p` | `Libp2p` | libp2pインスタンス |
| `companions` | `Map<string, Metadata>` | 接続中のコンパニオンリスト |
| `pendingQueries` | `Map` | 待機中のクエリ |
| `agent` | `CompanionAgent` | エージェント自身 |

### run

```typescript
run: Run
```

`createToolInstructionWorkflow`で生成されたワークフローのRun instance。

### count

```typescript
count: number
```

現在のターンカウント（`maxTurn`設定時に使用）。

### config

```typescript
config: { maxTurn: number | null; enableRepetitionJudge: boolean }
```

コンストラクタで渡された設定。

## メソッド

### generateToolInstruction()

メッセージを受け取り、CEL式を評価してツール実行の指示文を生成します。

```typescript
async generateToolInstruction(input: Message): Promise<string>
```

**パラメータ:**

- `input`: 受信したメッセージ

**戻り値:**

- `string`: ツール実行指示（例: "自己紹介をする。ツールを使って返信する。"）
- または `"failed"`: イベント実行失敗時

**処理フロー:**

1. Workflowの`evaluateStep`でLLMが`params`スキーマを評価
2. `runStep`でCEL式に基づいて条件をチェック
3. マッチした条件の`instruction`を結合して返す

```typescript
async generateToolInstruction(input: Message) {
  const res = await this.run.start({ inputData: input });
  return res.status === "success" ? res.result : res.status;
}
```

### generateState()

メッセージに対する自分の状態（State）を生成します。

```typescript
async generateState(message: Message): Promise<State>
```

**パラメータ:**

- `message`: 受信したメッセージ

**戻り値:**

- `State`: 状態情報（speak/listen、importance、selected、closingなど）

**処理フロー:**

1. 重複検出を実行（`enableRepetitionJudge`が`true`の場合）
2. スコアが0.7以上ならクロージング指示を追加
3. LLMがStateを生成
4. `maxTurn`チェック（設定時）

```typescript
async generateState(message: Message): Promise<State> {
 let closingInstruction: string = "";

 if (this.config.enableRepetitionJudge) {
   const formatted = this.history.map((message) => message.params.message);
   const result = await this.repetitionJudge.evaluate(formatted);
   logger.info({ result }, "Repetition judge evaluation");
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

 const res = await this.agent.generate(statePrompt, {
   runtimeContext: this.runtimeContext,
   output: StateBody,
   resourceId: "main",
   threadId: "thread",
 });

 //ターン上限が設けられている場合;
 if (this.config.maxTurn) {
   //会話が終了したらターンカウントを0に
   if (res.object.closing === "terminal") {
     this.count = 0;
     //ターン上限を超えたら
   } else if (this.count >= this.config.maxTurn) {
     //強制的に会話終了の意思表示
     res.object.closing = "terminal";
     this.count = 0;
   } else {
     this.count++;
   }
 }
 return { jsonrpc: "2.0", method: "state.send", params: res.object };
}
```

詳細は[ターンテイキング](../core/turn-taking#state状態の生成)を参照。

### input()

メッセージを受け取り、ツール実行指示に基づいてLLMを実行します。

```typescript
async input(message: Message): Promise<void>
```

**パラメータ:**

- `message`: 受信したメッセージ

**処理フロー:**

1. `generateToolInstruction`でツール実行指示を取得
2. LLMに指示とメッセージを渡して実行
3. LLMが必要に応じてツールを自動実行
