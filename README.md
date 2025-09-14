# aikyo
[日本語](./README-ja.md) | [**English**](./README.md)  

aikyo is a framework for building interconnected AI companions.

## Features

- Natural companion-to-companion conversations via floor-control–based turn-taking
- Flexible tool-usage rules defined with [CEL](https://cel.dev)
- Frontend extensibility by parameterizing character behaviors

## Installation
```bash
$ pnpm i @aikyo/utils @aikyo/server @aikyo/firehose
```

## License

[MIT License](./LICENSE)

## Contribution

Contributions are welcome!

### prerequisites

`pnpm` and `Node.js` (>= 22)

<details><summary>Using nix flake</summary>

First, enter the devShell.
```bash
$ nix develop
```

</details>

<details><summary>using mise</summary>


```bash
$ mise install
```

</details>

### Setup

Install the packages.

```bash
$ pnpm install
```

Setup `.env` file.  
Required environment variables are API keys for providers supported by [ai-sdk](https://ai-sdk.dev/docs/foundations/providers-and-models).
```bash
$ cp .env.example .env
```

### Run / Development Workflow

<details><summary>Using nix flake</summary>

Both firehose and companion can be launched simultaneously.
```bash
# Usage: nix run .#dev -- <COMPANION> [<COMPANION> ...]
# Example: nix run .#dev -- hanabi polka
$ nix run .#dev
```

</details>

```bash
# 1) Start the firehose server (default: http://localhost:8080)
$ pnpm run firehose


# 2) Launch a companion by name (see configs/ directory for available names)
$ pnpm run companion <companion_name>
```