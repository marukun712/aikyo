import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { config } from "dotenv";
import {
  MemorySchema,
  Message,
  type CompanionCard,
} from "../../schema/index.ts";
import { Run, type LanguageModel } from "@mastra/core";
import { RuntimeContext } from "@mastra/core/runtime-context";
import { createToolInstructionWorkflow } from "../workflow/index.ts";
config();

export interface ICompanionAgent {
  companion: CompanionCard;
  agent: Agent;
  memory: Memory;
  runtimeContext: RuntimeContext;
  run: Run;

  generateToolInstruction(input: Message): Promise<string>;
  input(message: Message): Promise<void>;
}

export class CompanionAgent implements ICompanionAgent {
  companion: CompanionCard;
  agent: Agent;
  memory: Memory;
  runtimeContext: RuntimeContext;
  run: Run;

  constructor(companion: CompanionCard, model: LanguageModel) {
    // コンパニオンを初期化
    this.companion = companion;

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
            return `${value}:${value.description}`;
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
      this.companion
    );
    this.run = workflow.createRun();

    // スレッドを作成
    this.memory.createThread({ resourceId: "main", threadId: "thread" });
  }

  async generateToolInstruction(input: Message) {
    const res = await this.run.start({ inputData: input });
    return res.status === "success" ? res.result : res.status;
  }

  // メッセージ生成
  async input(message: Message) {
    // CEL式を評価し、Instructionを取得
    const instructions = await this.generateToolInstruction(message);
    if (typeof instructions !== "string" || instructions === "failed") {
      throw new Error("イベント実行に失敗しました。");
    }
    console.log(instructions);
    const res = await this.agent.generate(
      JSON.stringify(message, null, 2),
      {
        runtimeContext: this.runtimeContext,
        resourceId: "main",
        threadId: "thread",
        context: [{ role: "system", content: instructions }]
      }
    );
    console.log(res.text);
  }
}
