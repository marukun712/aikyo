// @ts-check

import starlight from "@astrojs/starlight";
import catppuccin from "@catppuccin/starlight";
import { defineConfig } from "astro/config";
// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: "aikyo",
      locales: {
        root: {
          label: "日本語",
          lang: "ja",
        },
      },
      defaultLocale: "ja",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/marukun712/aikyo",
        },
      ],
      sidebar: [
        {
          label: "はじめる",
          items: [
            { label: "コンセプト", slug: "concept" },
            { label: "クイックスタート", slug: "quick-start" },
          ],
        },
        {
          label: "学ぶ",
          items: [
            {
              label: "会話制御",
              items: [
                { label: "ターンテイキング", slug: "core/turn-taking" },
                { label: "会話クロージング", slug: "core/closing" },
                { label: "重複検出", slug: "core/repetition" },
                { label: "P2P通信", slug: "core/p2p" },
              ],
            },
            {
              label: "ツール",
              items: [
                { label: "Knowledge（知識ツール）", slug: "tools/knowledge" },
                { label: "Action（行動ツール）", slug: "tools/action" },
                { label: "Query（クエリシステム）", slug: "tools/query" },
              ],
            },
          ],
        },
        {
          label: "API",
          items: [
            { label: "CompanionCard", slug: "api/companion-card" },
            { label: "CompanionAgent", slug: "api/companion-agent" },
            { label: "CompanionServer", slug: "api/companion-server" },
            { label: "Firehose", slug: "api/firehose" },
          ],
        },
      ],
      plugins: [catppuccin()],
    }),
  ],
});
