import { readdirSync } from "node:fs";
import { join } from "node:path";

const configName = process.argv[2];

if (!configName) {
  console.error("Usage: pnpm companion <config-name>");
  process.exit(1);
}

const configsDir = join(process.cwd(), "companions");
let availableConfigs: string[] = [];

try {
  availableConfigs = readdirSync(configsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
} catch {
  console.error(`companions directory not found: ${configsDir}`);
  process.exit(1);
}

if (!availableConfigs.includes(configName)) {
  console.error(
    `Config "${configName}" not found. Available: ${availableConfigs.join(", ")}`,
  );
  process.exit(1);
}

console.log(`Starting companion: ${configName}`);

try {
  await import(`../companions/${configName}/companion.ts`);
} catch (error) {
  console.error(`Failed to start companion "${configName}":`, error);
  process.exit(1);
}
