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
        ja: {
          label: "日本語",
          lang: "ja",
        },
        root: {
          label: "English",
          lang: "en",
        },
      },
      defaultLocale: "root",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/marukun712/aikyo",
        },
      ],
      sidebar: [
        {
          label: "Getting Started",
          translations: { ja: "はじめる" },
          items: [
            {
              label: "Concept",
              translations: { ja: "コンセプト" },
              slug: "concept",
            },
            {
              label: "Quick Start",
              translations: { ja: "クイックスタート" },
              slug: "quick-start",
            },
            {
              label: "Tutorial",
              translations: { ja: "チュートリアル" },
              slug: "tutorial",
            },
          ],
        },
        {
          label: "Learn",
          translations: { ja: "学ぶ" },
          items: [
            {
              label: "Conversation Control",
              translations: { ja: "会話制御" },
              items: [
                {
                  label: "Turn-Taking",
                  translations: { ja: "ターンテイキング" },
                  slug: "core/turn-taking",
                },
                {
                  label: "Conversation Closing",
                  translations: { ja: "会話クロージング" },
                  slug: "core/closing",
                },
                {
                  label: "Repetition Detection",
                  translations: { ja: "重複検出" },
                  slug: "core/repetition",
                },
                {
                  label: "P2P Communication",
                  translations: { ja: "P2P通信" },
                  slug: "core/p2p",
                },
              ],
            },
            {
              label: "Tools",
              translations: { ja: "ツール" },
              items: [
                {
                  label: "Knowledge",
                  translations: { ja: "Knowledge（知識ツール）" },
                  slug: "tools/knowledge",
                },
                {
                  label: "Action",
                  translations: { ja: "Action（行動ツール）" },
                  slug: "tools/action",
                },
                {
                  label: "Query System",
                  translations: { ja: "Query（クエリシステム）" },
                  slug: "tools/query",
                },
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
