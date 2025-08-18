import { Agent as MastraAgent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { config } from "dotenv";
import { CompanionCard } from "../../schema/index.ts";
import { LanguageModel } from "@mastra/core";
config();

export interface ICompanionAgent {
  companion: CompanionCard;
  runAgent(input: string | { image: string; mimeType: string }): Promise<any>;
}

export class CompanionAgent implements ICompanionAgent {
  companion: CompanionCard;
  agent: MastraAgent;

  constructor(companion: CompanionCard, model: LanguageModel) {
    this.companion = companion;

    //長期記憶記憶DBの設定
    const memory = new Memory({
      storage: new LibSQLStore({
        url: "file:db/mastra.db",
      }),
      vector: new LibSQLVector({
        connectionUrl: `file:db/${this.companion.metadata.id}.db`,
      }),
      options: { workingMemory: { enabled: true } },
    });

    //Agentを作成
    this.agent = new MastraAgent({
      name: companion.metadata.name,
      instructions: `
      あなたのメタデータ
      ${JSON.stringify(companion.metadata, null, 2)}
      このメタデータに記載されているキャラクター情報、口調などに忠実に従ってください。

      あなたの役割は、
      ${companion.role}です。この役割に忠実に行動してください。

      あなたには、contextデータがネットワークから渡されます。

      このcontextを長期記憶に保存し、必要であればツールを実行してください。
      "絶対に"、ツールを使用する、のようなメタ的な発言をしてはいけません。
      `,
      model,
      memory: memory,
      tools: companion.actions,
    });
  }

  //長期記憶に行動基準が左右されないよう、常に最新の行動基準をcontextに含む
  private buildBaseContext() {
    return [
      {
        role: "user" as const,
        content: [
          {
            type: "text" as const,
            text: `
          ${JSON.stringify(this.companion.events, null, 2)}
          あなたは、この条件に従って与えられたツールを使用する必要があります。
          "絶対に" この条件にないタイミングでツールを使ってはいけません。`,
          },
        ],
      },
    ];
  }

  //画像またはテキスト入力に対応
  async runAgent(input: string | { image: string; mimeType: string }) {
    let messages;

    if (typeof input === "string") {
      messages = input;
    } else {
      messages = [
        {
          role: "user" as const,
          content: [
            {
              type: "image" as const,
              image: input.image,
              mimeType: input.mimeType,
            },
          ],
        },
      ];
    }

    return this.agent.generate(messages, {
      context: this.buildBaseContext(),
      resourceId: "main",
      threadId: "thread",
    });
  }
}
