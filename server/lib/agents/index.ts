import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { config } from "dotenv";
import { type CompanionCard } from "../../schema/index.ts";
import { Run, type LanguageModel } from "@mastra/core";
import { RuntimeContext } from "@mastra/core/runtime-context";
import { createEventWorkflow } from "../workflow/index.ts";
config();

export interface ICompanionAgent {
  companion: CompanionCard;
  agent: Agent;
  runtimeContext: RuntimeContext;
  run: Run;

  runAgent(input: string | { image: string; mimeType: string }): Promise<any>;
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

      あなたはには、2種類のデータが渡されます。
      このようなデータは、同じ部屋にいる他のコンパニオンやユーザーから伝えられるメッセージです。
      {
        "metadata": {},
        "from": "companion_xxxx",
        "message": "こんにちは！",
      }
      companion_xxxxというfromがついているのがコンパニオン、user_xxxxというfromがついているのがユーザーです。

      あなたには、知識を得るための以下のツールが与えられています。
      これらのツールは、あなたが知識を得たいと感じたタイミングで実行してください。
      ${Object.values(companion.knowledge)
        .map((value) => {
          return `${value}:${value.description}`;
        })
        .join("\n")}

      その他のテキストデータや画像データは、contextと呼ばれる、コンパニオン間での共通認識です。
      このcontextを長期記憶に保存してください。

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
      this.companion
    );
    this.runtimeContext.set("id", companion.metadata.id);
    this.run = workflow.createRun();
  }

  //画像またはテキスト入力に対応
  async runAgent(input: string | { image: string; mimeType: string }) {
    const res = await this.run.start({ inputData: input });
    return {
      text: res.status === "success" ? res.result : res.status,
    };
  }
}
