import { mkdirSync } from "node:fs";
import type { LanguageModel, Run } from "@mastra/core";
import { Agent } from "@mastra/core/agent";
import { RuntimeContext } from "@mastra/core/runtime-context";
import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { Memory } from "@mastra/memory";
import { config } from "dotenv";
import z from "zod";
import {
  type CompanionCard,
  MemorySchema,
  type Message,
  type State,
} from "../../schema/index.js";
import { logger } from "../logger.js";
import { RepetitionJudge } from "../workflow/evals/repetition.js";
import { StateJudge } from "../workflow/evals/state.js";
import { createToolInstructionWorkflow } from "../workflow/index.js";

config();

export interface ICompanionAgent {
  companion: CompanionCard;
  agent: Agent;
  history: Message[];

  repetitionJudge: RepetitionJudge;
  stateJudge: StateJudge;

  memory: Memory;
  runtimeContext: RuntimeContext;
  run: Run;
  count: number;
  config: { maxTurn?: number; enableRepetitionJudge?: boolean };

  generateToolInstruction(): Promise<string>;
  getState(): Promise<State>;
  generate(): Promise<void>;
}

export class CompanionAgent implements ICompanionAgent {
  companion: CompanionCard;
  agent: Agent;
  history: Message[];
  private currentAbortController: AbortController | null = null;

  repetitionJudge: RepetitionJudge;
  stateJudge: StateJudge;

  memory: Memory;
  runtimeContext: RuntimeContext;
  run: Run;
  count: number;
  config: { maxTurn?: number; enableRepetitionJudge?: boolean };

  constructor(
    companion: CompanionCard,
    model: LanguageModel,
    history: Message[],
    config?: { maxTurn?: number; enableRepetitionJudge?: boolean },
  ) {
    // コンパニオンを初期化
    this.companion = companion;
    this.history = history;

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

    this.repetitionJudge = new RepetitionJudge(model);
    this.stateJudge = new StateJudge(model);

    // RuntimeContextを初期化
    this.runtimeContext = new RuntimeContext();
    this.runtimeContext.set("id", companion.metadata.id);

    // Workflowを初期化
    const workflow = createToolInstructionWorkflow(this.agent, this.companion);
    this.run = workflow.createRun();

    // スレッドを作成
    this.memory.createThread({ resourceId: "main", threadId: "thread" });

    this.count = 0;
    this.config = {
      enableRepetitionJudge: true,
      ...(config ?? {}),
    };
  }

  async generateToolInstruction() {
    //toolの使用指示を取得
    const res = await this.run.start({
      inputData: { history: this.history },
    });
    return res.status === "success" ? res.result : res.status;
  }

  async getState() {
    let closingInstruction: string = "";

    //繰り返し検出が有効になっている場合
    if (this.config.enableRepetitionJudge && this.history.length >= 5) {
      //string[]に変形
      const formatted = this.history.map((message) => message.params.message);
      //評価
      const result = await this.repetitionJudge.evaluate(formatted);
      const repetition = result.score;
      if (repetition > 0.7) {
        //プロンプトに会話の終了か転換を促すプロンプトをいれる
        closingInstruction =
          "最重要:会話が繰り返しになっています。直ちにclosingをpre-closing,closing,terminalの順に変えて終了するか、話題を変えてください。";
      }
    }

    const [state, res] = await Promise.all([
      // stateを取得
      this.stateJudge.evaluate(this.companion.metadata.id, this.history),

      // closingの判定
      this.agent.generate(
        `
        今までの会話を振り返り、今の会話の終了状態を以下の４つの状態で判定してください。

        状態一覧:
        closing ("none", "pre-closing", "closing", "terminal")
        - none: 会話継続
        - pre-closing: 会話を終わりに向ける布石
        - closing: クロージング表現(感謝・挨拶など)
        - terminal: 最後の別れの挨拶

        ${closingInstruction}
        また、この判断の内容は発言内容に絶対に含めないでください。
        `,
        {
          output: z.object({
            closing: z.enum(["none", "pre-closing", "closing", "terminal"]),
          }),
          resourceId: "main",
          threadId: "thread",
        },
      ),
    ]);

    let closing = res.object.closing;
    //ターン上限が設けられている場合;
    if (this.config.maxTurn) {
      //会話が終了したらターンカウントを0に
      if (closing === "terminal") {
        this.count = 0;
        //ターン上限を超えたら
      } else if (this.count >= this.config.maxTurn) {
        //強制的に会話終了の意思表示
        closing = "terminal";
        this.count = 0;
      } else {
        this.count++;
      }
    }

    return {
      jsonrpc: "2.0" as const,
      method: "state.send" as const,
      params: { ...state, closing },
    };
  }

  // メッセージ生成
  async generate() {
    try {
      // 既存のgenerate処理をabort
      if (this.currentAbortController) {
        this.currentAbortController.abort();
      }

      // 新しいAbortControllerを作成
      const controller = new AbortController();
      this.currentAbortController = controller;

      try {
        // CEL式を評価し、Instructionを取得
        const instructions = await this.generateToolInstruction();
        if (typeof instructions !== "string" || instructions === "failed") {
          throw new Error("イベント実行に失敗しました。");
        }
        logger.info({ instructions }, "Generated tool instructions");
        //メタデータとツール指示をコンテキストに含める
        const res = await this.agent.generate(instructions, {
          runtimeContext: this.runtimeContext,
          resourceId: "main",
          threadId: "thread",
          abortSignal: controller.signal,
        });
        logger.info({ text: res.text }, "Agent response");
      } finally {
        if (this.currentAbortController === controller) {
          this.currentAbortController = null;
        }
      }
    } catch (e) {
      logger.error(e);
    }
  }
}
