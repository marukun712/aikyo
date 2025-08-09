import fs from "fs";
import { AiCompanionSchema, type AiCompanion } from "./schema";
import { Hono } from "hono";

const app = new Hono();

const companions = new Map<string, AiCompanion>();
const dirPath = "./agents";
const fileNames = fs.readdirSync(dirPath);

fileNames.forEach((fileName) => {
  const file = fs.readFileSync([dirPath, fileName].join("/"), "utf8");
  const parsed = AiCompanionSchema.safeParse(JSON.parse(file));
  if (parsed.success) {
    companions.set(parsed.data.metadata.id, parsed.data);
  } else {
    console.error(parsed.error);
  }
});

const metadata: AiCompanion[] = [];
companions.forEach((companion) => {
  metadata.push({ metadata: companion.metadata });
});

app.get("/metadata", (c) => {
  return c.json(metadata);
});

Bun.serve({ fetch: app.fetch, port: 3000 });
console.log("server started and listening on http://localhost:3000");
