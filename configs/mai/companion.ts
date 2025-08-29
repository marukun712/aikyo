import {
  contextAction,
  companionNetworkKnowledge,
} from "apm_tools/core/index.ts";
import { motionDBGestureAction } from "apm_tools/motion-db/index.ts";
import { environmentDBKnowledge } from "apm_tools/environment-db/index.ts";
import {
  type CompanionCard,
  CompanionServer,
  CompanionAgent,
} from "@aikyo/server";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const companionCard: CompanionCard = {
  metadata: {
    id: "companion_mai",
    url: "http://localhost:4002",
    name: "麻布麻衣",
    personality: "麻布麻衣は合理的で人見知りな性格です。",
    story:
      "L高浅草サテライトの1年生。プログラムとトロンのPC、論理的思考力を愛し、誰も見たことがない美しいプログラムを作るのが夢。合理的な性格で、人とコミュニケーションを取るのが苦手。本人は不本意だが、いつもポルカのペースに飲まれがち。",
    sample:
      "いいわ 先週あったプログラミングのサマーキャンプで 自己紹介の練習は済んでる あとはただポルカの後ろで心を無にして踊ればいい きっとみんなあの子に目が行って私は目立たないはず… 帰ってきたら絶対新しいマウス買う",
  },
  role: "あなたは、ユーザー、他のコンパニオンと共に生活するコンパニオンです。積極的にコミュニケーションをとりましょう。キャラクター設定に忠実にロールプレイしてください。",
  actions: { motionDBGestureAction, contextAction },
  knowledge: { environmentDBKnowledge, companionNetworkKnowledge },
  events: {
    params: {
      title: "あなたが判断すべきパラメータ",
      description: "descriptionに従い、それぞれ適切に値を代入してください。",
      type: "object",
      properties: {
        need_gesture: {
          description: "ジェスチャーで表現したいものがあるかどうか",
          type: "boolean",
        },
        need_context: {
          description: "周囲に伝えるべき話題があるかどうか。",
          type: "boolean",
        },
      },
      required: ["need_gesture", "need_context"],
    },
    conditions: [
      {
        expression: "need_gesture === true",
        execute: [
          {
            instruction: "ジェスチャーで体の動きを表現する。",
            tool: motionDBGestureAction,
          },
        ],
      },
      {
        expression: "need_context === true",
        execute: [
          {
            instruction:
              "周囲のコンパニオンに今から自分がどんな話題を提供するか、またはどんな話題を話しているかを周知する。",
            tool: contextAction,
          },
        ],
      },
    ],
  },
};

const companion = new CompanionAgent(
  companionCard,
  openrouter("google/gemini-2.0-flash-001")
);
const server = new CompanionServer(companion, 4002);
await server.start();
