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

### 動作確認済みLLMプロバイダー

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

### stateJudge

```typescript
stateJudge: StateJudge
```

会話履歴を元にコンパニオンの状態（State）を生成するジャッジ。ターンテイキングに使用されます。

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

**永続化:**

- `db/<companion_id>.db`にLibSQLデータベースを作成
- LibSQLStoreによるストレージとLibSQLVectorによるベクトルストアを使用
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

### generateState()

会話履歴全体を元に、自分の状態（State）を生成します。

```typescript
async generateState(): Promise<State>
```

**パラメータ:**

なし（内部で`this.history`を参照）

**戻り値:**

- `State`: 状態情報（speak/listen、importance、selected、closingなど）

**処理フロー:**

1. 重複検出を実行（`enableRepetitionJudge`が`true`の場合）
2. スコア > 0.7ならクロージング指示を追加
3. `StateJudge`を使用してStateを生成
4. `maxTurn`チェック（設定時）

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
