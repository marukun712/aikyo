// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import catppuccin from "@catppuccin/starlight";

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: "aikyo",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/marukun712/aikyo",
        },
      ],
      sidebar: [
        {
          label: "はじめに",
          items: [
            { label: "コンセプト", slug: "concept" },
            { label: "クイックスタート", slug: "quick-start" },
            { label: "フレームワーク概要", slug: "overview" },
          ],
        },
        {
          label: "コア概念",
          items: [
            { label: "Companion Card", slug: "companion-cards" },
            { label: "P2P通信", slug: "p2p-communication" },
            { label: "Action & Knowledge", slug: "actions-knowledge" },
          ],
        },
        {
          label: "APIリファレンス",
          items: [
            { label: "Companion Card Schema", slug: "api/companion-card" },
            { label: "Action API", slug: "api/actions" },
            { label: "Knowledge API", slug: "api/knowledge" },
            { label: "メッセージタイプ", slug: "api/messages" },
          ],
        },
      ],
      plugins: [catppuccin()],
    }),
  ],
});
