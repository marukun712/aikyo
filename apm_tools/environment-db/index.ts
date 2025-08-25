import { createCompanionKnowledge } from "@aikyo/core";
import z from "zod";

const semanticLabels = [
  "CEILING",
  "DOOR_FRAME",
  "FLOOR",
  "INVISIBLE_WALL_FACE",
  "WALL_ART",
  "WALL_FACE",
  "WINDOW_FRAME",
  "COUCH",
  "TABLE",
  "BED",
  "LAMP",
  "PLANT",
  "SCREEN",
  "STORAGE",
  "GLOBAL_MESH",
  "OTHER",
] as const;

type SemanticLabel = (typeof semanticLabels)[number];

export class EnvironmentDBFetcher {
  url: string;
  semanticLabels = semanticLabels;

  constructor(url: string) {
    this.url = new URL(url).href;
  }

  async fetch(label: SemanticLabel) {
    console.log(label);
    const res = await fetch(`${this.url}get?label=${label}`);
    const json = await res.json();
    console.log(json);
    return json;
  }
}

const fetcher = new EnvironmentDBFetcher("http://localhost:9000");

export const environmentDBKnowledge = createCompanionKnowledge({
  id: "environment-db",
  description: "あなたの部屋の家具情報などを取得します。",
  inputSchema: z.object({
    label: z.enum(semanticLabels),
  }),
  knowledge: async ({ label }) => {
    const json = await fetcher.fetch(label);
    const data = JSON.stringify(json, null, 2);
    return data;
  },
});
