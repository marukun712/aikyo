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
} from "../../schema/index.js";
import { logger } from "../logger.js";
import { RepetitionJudge } from "../workflow/evals/repetition.js";
import { StateJudge } from "../workflow/evals/state.js";
import { createToolInstructionWorkflow } from "../workflow/index.js";

config();

export interface ICompanionAgent {
  companion: CompanionCard;
  agent: Agent;
  repetitionJudge: RepetitionJudge;
  history: Message[];
  memory: Memory;
  runtimeContext: RuntimeContext;
  run: Run;
  count: number;
  config: { maxTurn: number | null; enableRepetitionJudge: boolean };

  generateToolInstruction(input: Message): Promise<string>;
  generateState(): Promise<State>;
  input(message: Message): Promise<void>;
}

export class CompanionAgent implements ICompanionAgent {
  companion: CompanionCard;
  agent: Agent;
  repetitionJudge: RepetitionJudge;
  stateJudge: StateJudge;
  history: Message[];
  memory: Memory;
  runtimeContext: RuntimeContext;
  run: Run;
  count: number;
  config: { maxTurn: number | null; enableRepetitionJudge: boolean };

  constructor(
    companion: CompanionCard,
    model: LanguageModel,
    history: Message[],
    config?: { maxTurn: number | null; enableRepetitionJudge: boolean },
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
    const workflow = createToolInstructionWorkflow(
      this.agent,
      this.runtimeContext,
      this.companion,
    );
    this.run = workflow.createRun();

    // スレッドを作成
    this.memory.createThread({ resourceId: "main", threadId: "thread" });

    this.count = 0;
    this.config = config
      ? config
      : { maxTurn: null, enableRepetitionJudge: true };
  }

  async generateToolInstruction(input: Message) {
    const res = await this.run.start({
      inputData: { message: input, history: this.history },
    });
    return res.status === "success" ? res.result : res.status;
  }

  async generateState(): Promise<State> {
    let closingInstruction: string = "";

    if (this.config.enableRepetitionJudge) {
      const formatted = this.history.map((message) => message.params.message);
      const result = await this.repetitionJudge.evaluate(formatted);
      logger.info({ result }, "Repetition judge evaluation");
      const repetition = result.score;
      if (repetition > 0.7) {
        closingInstruction =
          'Most important: the conversation is becoming repetitive. Immediately either shift the closing status through "pre-closing", "closing", and "terminal" in order to end the conversation, or change the topic.';
      }
    }

    const state = await this.stateJudge.evaluate(
      this.companion.metadata.id,
      this.history,
      closingInstruction,
    );

    //ターン上限が設けられている場合;
    if (this.config.maxTurn) {
      //会話が終了したらターンカウントを0に
      if (state.closing === "terminal") {
        this.count = 0;
        //ターン上限を超えたら
      } else if (this.count >= this.config.maxTurn) {
        //強制的に会話終了の意思表示
        state.closing = "terminal";
        this.count = 0;
      } else {
        this.count++;
      }
    }
    return { jsonrpc: "2.0", method: "state.send", params: state };
  }

  // メッセージ生成
  async input(message: Message) {
    // CEL式を評価し、Instructionを取得
    const instructions = await this.generateToolInstruction(message);
    if (typeof instructions !== "string" || instructions === "failed") {
      throw new Error("イベント実行に失敗しました。");
    }
    logger.info({ instructions }, "Generated tool instructions");
    const res = await this.agent.generate(JSON.stringify(message, null, 2), {
      runtimeContext: this.runtimeContext,
      resourceId: "main",
      threadId: "thread",
      context: [
        { role: "system", content: instructions },
        {
          role: "system",
          content: `
            あなたのメタデータ
            ${JSON.stringify(this.companion.metadata, null, 2)}
            このメタデータに記載されているキャラクター情報、口調などに忠実にロールプレイをしてください。
          `,
        },
      ],
    });
    logger.info({ text: res.text }, "Agent response generated");
  }
}
