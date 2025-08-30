import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { config } from "dotenv";
import { Message, type CompanionCard } from "../../schema/index.ts";
import { CoreMessage, Run, type LanguageModel } from "@mastra/core";
import { RuntimeContext } from "@mastra/core/runtime-context";
import { createEventWorkflow } from "../workflow/index.ts";
import { talkTool } from "../tool/index.ts";
import z from "zod";
import { Libp2p } from "libp2p";
import { Services } from "@aikyo/utils";
config();

export interface ICompanionAgent {
  companion: CompanionCard;
  agent: Agent;
  memory: Memory;
  runtimeContext: RuntimeContext;
  run: Run;

  generateToolInstruction(
    input: string | { image: string; mimeType: string }
  ): Promise<string>;
  addContext(input: string): Promise<void>;
  generateMessage(input: Omit<Message, "to">): Promise<Message>;
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
        workingMemory: { enabled: true },
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

      あなたには、他のコンパニオンと会話するためのtalkツールが与えられています。
      このツールを使うときは、できるだけ会話をながく続けることを意識してください。

      "絶対に"、ツールを使用する、のようなメタ的な発言をしてはいけません。
      必ずワーキングメモリを更新してください。
      `,
      model,
      memory: this.memory,
      tools: { ...companion.actions, ...companion.knowledge, talkTool },
    });

    // RuntimeContextを初期化
    this.runtimeContext = new RuntimeContext();
    this.runtimeContext.set("id", companion.metadata.id);

    // Workflowを初期化
    const workflow = createEventWorkflow(
      this.agent,
      this.runtimeContext,
      this.companion,
    );
    this.run = workflow.createRun();

    // スレッドを作成
    this.memory.createThread({ resourceId: "main", threadId: "thread" });
  }

  // 画像またはテキスト入力に対応
  async generateToolInstruction(
    input: string | { image: string; mimeType: string },
  ) {
    const res = await this.run.start({ inputData: input });
    return res.status === "success" ? res.result : res.status;
  }

  // ワーキングメモリにコンテキストを追加
  async addContext(input: string) {
    this.memory.updateWorkingMemory({
      resourceId: "main",
      threadId: "thread",
      workingMemory: input,
    });
  }

  // メッセージ生成
  async generateMessage(input: Omit<Message, "to">) {
    // CEL式を評価し、Instructionを取得
    const instructions = await this.generateToolInstruction(input.message);
    if (typeof instructions !== "string" || instructions === "failed") {
      throw new Error("イベント実行に失敗しました。");
    }

    // ツールのみを実行
    await this.agent.generate(
      [
        {
          role: "system",
          content: `
          指示に従い、会話の文脈にあったツールを実行してください。
          `,
        },
      ],
      {
        runtimeContext: this.runtimeContext,
        resourceId: "main",
        threadId: "thread",
        instructions,
      },
    );

    // システムプロンプトを初期化
    const systemMessage: CoreMessage = {
      role: "system",
      content: `
      今までの文脈から、最終的にキャラクターとしてレスポンスするメッセージを作成してください。
      必ず、このスキーマで返信してください。
      {
        "metadata": {
          emotion: "neutral" | "happy" | "sad" | "angry",
        },
        "message": "メッセージ本文",
      }
      `,
    };

    // 感情と、応答をJSON形式で生成
    const res = await this.agent.generate([systemMessage], {
      output: z.object({
        metadata: z.object({
          emotion: z
            .enum(["neutral", "happy", "sad", "angry"])
            .describe(
              "キャラクターとしての感情として、最も適切なものを入れてください。",
            ),
        }),
        message: z.string(),
      }),
      resourceId: "main",
      threadId: "thread",
    });

    // レスポンスオブジェクトを取得
    const output = res.object;

    // 最終的に出力するデータ形式に変換
    const data: Message = {
      from: this.companion.metadata.id, // 送信元ID (Peer IDではない)
      to: input.from, // 送信先ID (Peer IDではない)
      message: output.message, // メッセージ本文
      metadata: {
        emotion: output.metadata.emotion, // 感情
      },
    };

    try {
      // ランタイムコンテキストから、Libp2pインスタンスを取得
      const libp2p: Libp2p<Services> = this.runtimeContext.get("libp2p");

      // libp2pでdataをpublish
      libp2p.services.pubsub.publish(
        "messages",
        new TextEncoder().encode(JSON.stringify(data, null, 2)),
      );
    } catch (e) {
      console.error(e);
    }
    return data;
  }
}
