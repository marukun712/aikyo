import { mkdirSync } from "node:fs";
import type { LanguageModel, Run } from "@mastra/core";
import { Agent } from "@mastra/core/agent";
import { RuntimeContext } from "@mastra/core/runtime-context";
import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { Memory } from "@mastra/memory";
import { config } from "dotenv";
import {
  type CompanionCard,
  MemorySchema,
  type Message,
  type State,
  StateSchema,
} from "../../schema/index.ts";
import { createToolInstructionWorkflow } from "../workflow/index.ts";

config();

export interface ICompanionAgent {
  companion: CompanionCard;
  agent: Agent;
  memory: Memory;
  runtimeContext: RuntimeContext;
  run: Run;
  count: number;
  maxTurn: number | null;

  generateToolInstruction(input: Message): Promise<string>;
  generateState(message: Message): Promise<State>;
  input(message: Message): Promise<void>;
}

export class CompanionAgent implements ICompanionAgent {
  companion: CompanionCard;
  agent: Agent;
  memory: Memory;
  runtimeContext: RuntimeContext;
  run: Run;
  count: number;
  maxTurn: number | null;

  constructor(
    companion: CompanionCard,
    model: LanguageModel,
    config?: { maxTurn: number | null },
  ) {
    // コンパニオンを初期化
    this.companion = companion;

    // 永続化に使用するdbディレクトリが無い場合は作成
    mkdirSync("db", { recursive: true });

    // 長期記憶記憶DBの設定
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

    // Agentを初期化
    this.agent = new Agent({
      name: companion.metadata.name,
      instructions: `
    あなたのメタデータ
    ${JSON.stringify(companion.metadata, null, 2)}
    このメタデータに記載されているキャラクター情報、口調などに忠実にロールプレイをしてください。

    あなたの役割は、
    ${companion.role}です。この役割に忠実に行動してください。

    あなたには、知識を得るための以下のツールが与えられています。
    これらのツールは、あなたが知識を得たいと感じたタイミングで実行してください。
    ${Object.values(companion.knowledge)
      .map((value) => {
        return `${value.id}:${value.description}`;
      })
      .join("\n")}

    必ず、定期的にワーキングメモリを更新してください。
    `,
      model,
      memory: this.memory,
      tools: { ...companion.actions, ...companion.knowledge },
    });

    // RuntimeContextを初期化
    this.runtimeContext = new RuntimeContext();
    this.runtimeContext.set("id", companion.metadata.id);

    // Workflowを初期化
    const workflow = createToolInstructionWorkflow(
      this.agent,
      this.runtimeContext,
      this.companion,
    );
    this.run = workflow.createRun();

    // スレッドを作成
    this.memory.createThread({ resourceId: "main", threadId: "thread" });

    this.count = 0;
    this.maxTurn = config ? config.maxTurn : null;
  }

  async generateToolInstruction(input: Message) {
    const res = await this.run.start({ inputData: input });
    return res.status === "success" ? res.result : res.status;
  }

  async generateState(message: Message): Promise<State> {
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
    最重要:あなたは積極的に会話をpre-closingにします。pre-closingにしたら、すぐにclosing,terminalと続けます。terminalになるまで、pre-closingからnoneに戻してはいけません。
    `;
    const res = await this.agent.generate(statePrompt, {
      runtimeContext: this.runtimeContext,
      output: StateSchema,
      resourceId: "main",
      threadId: "thread",
    });

    //ターン上限が設けられている場合;
    if (this.maxTurn) {
      //会話が終了したらターンカウントを0に
      if (res.object.closing === "terminal") {
        this.count = 0;
        //ターン上限を超えたら
      } else if (this.count >= this.maxTurn) {
        //強制的に会話終了の意思表示
        res.object.closing = "terminal";
        this.count = 0;
      } else {
        this.count++;
      }
    }
    return res.object;
  }

  // メッセージ生成
  async input(message: Message) {
    // CEL式を評価し、Instructionを取得
    const instructions = await this.generateToolInstruction(message);
    if (typeof instructions !== "string" || instructions === "failed") {
      throw new Error("イベント実行に失敗しました。");
    }
    console.log("Instructions:", instructions);
    const res = await this.agent.generate(JSON.stringify(message, null, 2), {
      runtimeContext: this.runtimeContext,
      resourceId: "main",
      threadId: "thread",
      context: [{ role: "system", content: instructions }],
    });
    console.log(res.text);
  }
}
