#!/usr/bin/env bun
/**
 * Wrapper launcher for configs/<name>/companion.ts
 * Usage examples:
 *   bun run companion --config=<name>
 *   bun run companion --config <name>
 *   bun run companion
 */

import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseConfigArg(argv: string[]): string | undefined {
  const args = argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--config" && i + 1 < args.length) return args[i + 1];
    if (a.startsWith("--config=")) return a.split("=", 2)[1];
  }
  // Fallbacks for different runners
  return (
    process.env.CONFIG ??
    process.env.npm_config_config ?? // npm/pnpm
    process.env.BUN_CONFIG // optional custom
  );
}

const configsDir = join(__dirname, "../configs");
let availableConfigs: string[] = [];

try {
  availableConfigs = readdirSync(configsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
} catch (e) {
  console.error(`[companion] configs dir not found: ${configsDir}`);
  console.error(e);
  process.exit(1);
}

if (availableConfigs.length === 0) {
  console.error(`[companion] no configs found in ${configsDir}`);
  process.exit(1);
}
const selected = parseConfigArg(process.argv);
if (!selected) {
  console.log(`[companion] no config specified`);
  throw new Error("Use bun run companion --config=<name> to select a config");
}

if (!availableConfigs.includes(selected)) {
  console.error(
    [
      `Invalid config: "${selected}"`,
      `Available: ${availableConfigs.join(", ")}`,
      `Try: bun run companion --config=<${availableConfigs.join("|")}>`,
    ].join("\n")
  );
  process.exit(1);
}

console.log(`[companion] launching config="${selected}"`);

try {
  // Importing the config module will start the server (each config file calls server.start())
  const spec = new URL(`../configs/${selected}/companion.ts`, import.meta.url)
    .href;
  await import(spec);
} catch (err) {
  console.error(`[companion] failed to launch "${selected}"`);
  console.error(err);
  process.exit(1);
}
