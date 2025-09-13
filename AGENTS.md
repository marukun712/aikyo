# Repository Guidelines

## Project Structure & Module Organization

- `server/` – Companion server core (libp2p, agents, schemas).
- `firehose/` – WebSocket ↔ libp2p bridge.
- `configs/<name>/companion.ts` – Companion Cards (runnable configs).
- `packages/utils/` – Shared utilities and types.
- `apm_tools/` – Action/knowledge modules (exported entry points).
- `scripts/companion.ts` – CLI to start a companion.
- `docs/` – Astro-based documentation site.
- `db/` – Per-companion local libSQL files (gitignored).

## Build, Test, and Development Commands

- Setup: `pnpm i` (Node 22; see `mise.toml` or use `nix-shell` via `shell.nix`).
- Start Firehose: `pnpm firehose` (reads `FIREHOSE_PORT`, default 8080).
- Run a companion: `pnpm companion polka` (loads `configs/polka/companion.ts`).
- Lint: `pnpm lint` (Oxlint over server, firehose, configs, packages).
- Format: `pnpm format` (Prettier repository-wide).

## Coding Style & Naming Conventions

- Language: TypeScript (ESM, strict). Target Node ≥20.9 (Node 22 recommended).
- Formatting: Prettier (2 spaces, width 100, double quotes).
- Linting: Oxlint with `no-unused-vars`, `prefer-const`, `no-eval` and recommended set.
- Naming: `camelCase` for variables/functions, `PascalCase` for types/classes, file names
  `kebab-case.ts`. Keep module entry points as `index.ts` where appropriate.

## Testing Guidelines

- The repo has no formal tests yet. When adding tests, prefer Vitest.
- Location: co-locate as `__tests__/` or `*.test.ts` beside sources (e.g., `server/lib/.../foo.test.ts`).
- Aim for ≥80% coverage on new code; test public APIs and critical workflows.
- Provide a root `test` script when introducing tests and document usage in package READMEs.

## Commit & Pull Request Guidelines

- Commits: follow Conventional Commits. Examples:
  - `feat(server): broadcast initial metadata on connect`
  - `fix(firehose): handle malformed WebSocket payloads`
- PRs: include a clear summary, affected workspaces, setup/run steps, and before/after notes.
- Quality gate: run `pnpm lint` and `pnpm format` before pushing; CI enforces lint on PRs.

## Security & Configuration Tips

- Never commit secrets. Copy `.env.example` to `.env` and set values like `FIREHOSE_PORT` and
  `ANTHROPIC_API_KEY` locally.
- Add new companions under `configs/<name>/companion.ts` and start with `pnpm companion <name>`.
