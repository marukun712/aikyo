import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { config } from "dotenv";
import { Message, type CompanionCard } from "../../schema/index.ts";
import { CoreMessage, Run, type LanguageModel } from "@mastra/core";
import { RuntimeContext } from "@mastra/core/runtime-context";
import { createEventWorkflow } from "../workflow/index.ts";
import z from "zod";
config();

export interface ICompanionAgent {
  companion: CompanionCard;
  agent: Agent;
  runtimeContext: RuntimeContext;
  run: Run;
}

export class CompanionAgent implements ICompanionAgent {
  companion: CompanionCard;
  agent: Agent;
  runtimeContext: RuntimeContext;
  run: Run;

  constructor(companion: CompanionCard, model: LanguageModel) {
    this.companion = companion;

    //長期記憶記憶DBの設定
    const memory = new Memory({
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

    //Agentを作成
    this.agent = new Agent({
      name: companion.metadata.name,
      instructions: `
      あなたのメタデータ
      ${JSON.stringify(companion.metadata, null, 2)}
      このメタデータに記載されているキャラクター情報、口調などに忠実に従ってください。

      あなたの役割は、
      ${companion.role}です。この役割に忠実に行動してください。

      あなたには、知識を得るための以下のツールが与えられています。
      これらのツールは、あなたが知識を得たいと感じたタイミングで実行してください。
      ${Object.values(companion.knowledge)
        .map((value) => {
          return `${value}:${value.description}`;
        })
        .join("\n")}

      "絶対に"、ツールを使用する、のようなメタ的な発言をしてはいけません。
      必ずワーキングメモリを更新してください。
      `,
      model,
      memory: memory,
      tools: { ...companion.actions, ...companion.knowledge },
    });
    this.runtimeContext = new RuntimeContext();
    const workflow = createEventWorkflow(
      this.agent,
      this.runtimeContext,
      this.companion,
    );
    this.runtimeContext.set("id", companion.metadata.id);
    this.run = workflow.createRun();
  }

  //画像またはテキスト入力に対応
  async generateToolInstruction(
    input: string | { image: string; mimeType: string },
  ) {
    const res = await this.run.start({ inputData: input });
    return {
      result: res.status === "success" ? res.result : res.status,
    };
  }

  async addContext(input: string | { image: string; mimeType: string }) {
    const instructions = await this.generateToolInstruction(input);
    if (typeof instructions !== "string" || instructions === "failed") {
      throw new Error("イベント実行に失敗しました。");
    }
    let interaction: CoreMessage;
    if (typeof input === "string") {
      interaction = { role: "user", content: input };
    } else {
      interaction = {
        role: "user" as const,
        content: [
          {
            type: "image" as const,
            image: input.image,
          },
        ],
      };
    }
    this.agent.generate([interaction], {
      resourceId: "main",
      threadId: "thread",
      instructions,
    });
  }

  //メッセージ生成
  async generateMessage(input: Message) {
    const instructions = await this.generateToolInstruction(input.message);
    if (typeof instructions !== "string" || instructions === "failed") {
      throw new Error("イベント実行に失敗しました。");
    }
    const res = await this.agent.generate(JSON.stringify(input, null, 2), {
      instructions: `
      与えられたメッセージに対して、キャラクターとして返信するメッセージを作成してください。
      必ず、このスキーマで返信してください。
      {
        "metadata": {
          emotion: "neutral" | "happy" | "sad" | "angry",
        },
        "message": "メッセージ本文",
      }
      ${instructions}
      `,
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
    const output = res.object;
    const data: Message = {
      from: this.companion.metadata.id,
      to: input.from,
      message: output.message,
      metadata: {
        emotion: output.metadata.emotion,
      },
    };
    return data;
  }
}
