import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "index.ts",
    "lib/**/*.ts",
    "tools/**/*.ts",
  ],
  format: ["esm"],
  target: "node22",
  outDir: "dist",
  dts: true,
  sourcemap: true,
  splitting: false,
  clean: true,
  bundle: false,
  skipNodeModulesBundle: true,
  tsconfig: "./tsconfig.json",
});
