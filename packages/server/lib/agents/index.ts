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
  type Metadata,
  type State,
} from "../../schema/index.js";
import { decideNextSpeaker } from "../conversation/index.js";
import { logger } from "../logger.js";
import { RepetitionJudge } from "../workflow/evals/repetition.js";
import { StateJudge } from "../workflow/evals/state.js";
import { createToolInstructionWorkflow } from "../workflow/index.js";

config();

export interface ICompanionAgent {
  card: CompanionCard;
  agent: Agent;
  history: Message[];
  runtimeContext: RuntimeContext;

  getStates(message: Message): Promise<State[]>;
  generate(speaker: State[], companions: Map<string, Metadata>): Promise<void>;
}

export class CompanionAgent implements ICompanionAgent {
  card: CompanionCard;
  agent: Agent;
  history: Message[];
  runtimeContext: RuntimeContext;

  generating: boolean;
  private repetitionJudge: RepetitionJudge;
  private stateJudge: StateJudge;
  private memory: Memory;
  private run: Run;
  private count: number;
  private config: { enableRepetitionJudge?: boolean };

  constructor(
    companion: CompanionCard,
    model: LanguageModel,
    history: Message[],
    config?: { enableRepetitionJudge?: boolean },
  ) {
    // コンパニオンを初期化
    this.card = companion;
    this.history = history;
    this.generating = false;

    // 永続化に使用するdbディレクトリが無い場合は作成
    mkdirSync("db", { recursive: true });

    // 長期記憶記憶DBの設定
    this.memory = new Memory({
      storage: new LibSQLStore({
        url: `file:db/${this.card.metadata.id}.db`,
      }),
      vector: new LibSQLVector({
        connectionUrl: `file:db/${this.card.metadata.id}.db`,
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
      ${Object.values(companion.knowledge).map((value) => {
        return `${value.id}:${value.description}`;
      })}

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
    const workflow = createToolInstructionWorkflow(this.agent, this.card);
    this.run = workflow.createRun();

    // スレッドを作成
    this.memory.createThread({ resourceId: "main", threadId: "thread" });

    this.count = 0;
    this.config = {
      enableRepetitionJudge: config ? config.enableRepetitionJudge : true,
    };
  }

  private async generateState(id: string) {
    const state = await this.stateJudge.evaluate(id, this.history);

    let closing = state.closing;

    //繰り返し検出が有効になっている場合
    if (this.config.enableRepetitionJudge && this.history.length >= 5) {
      //string[]に変形
      const formatted = this.history.map((message) => message.params.message);
      //評価
      const result = await this.repetitionJudge.evaluate(formatted);
      const repetition = result.score;
      if (repetition > 0.7) {
        switch (this.count) {
          case 0:
            closing = "pre-closing";
            this.count++;
            break;
          case 1:
            closing = "closing";
            this.count++;
            break;
          case 2:
            closing = "terminal";
            this.count = 0;
            break;
        }
      } else {
        this.count = 0;
      }
    }

    return {
      jsonrpc: "2.0" as const,
      method: "state.send" as const,
      params: { ...state, closing },
    };
  }

  private async generateToolInstruction() {
    //toolの使用指示を取得
    const res = await this.run.start({
      inputData: { history: this.history },
    });
    return res.status === "success" ? res.result : res.status;
  }

  async getStates(message: Message) {
    return await Promise.all(
      message.params.to.map(async (to) => await this.generateState(to)),
    );
  }

  async generate(states: State[], companions: Map<string, Metadata>) {
    try {
      if (this.generating) {
        logger.info("Skip generation: already generating");
        return;
      }
      this.generating = true;
      //接続されているコンパニオンでフィルタする
      const active = Array.from(companions.values()).map(
        (metadata) => metadata.id,
      );
      const speaker = decideNextSpeaker(states, active);
      if (!speaker || speaker.params.closing === "terminal")
        return logger.info("The conversation is over.");
      if (speaker.params.from === this.card.metadata.id) {
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
          context: [
            {
              role: "system",
              content: `あなたの発言状態は以下の通りです。
              ${JSON.stringify(speaker)}
              `,
            },
          ],
        });
        logger.info({ text: res.text }, "Agent response");
      }
    } catch (e) {
      logger.error(e);
    } finally {
      this.generating = false;
    }
  }
}
