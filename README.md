# aikyo
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/marukun712/aikyo)  
[日本語](./README-ja.md) | [**English**](./README.md)  

**aikyo is a framework for building interconnected AI companions.**

Join our Discord server!

https://discord.gg/JxAVZkQdDX

## Features

- Turn-taking functionality included as standard
- Natural conversations with multiple companions
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

### Requirements

`pnpm` , `Node.js` (>= 24.2)

<details><summary>Using Nix Flake</summary>

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
$ pnpm i
```

Create `.env` file.  
Enter an API key for each provider supported by the [ai-sdk](https://ai-sdk.dev/docs/foundations/providers-and-models).
```bash
$ cp .env.example .env
```

### Run / Development Workflow

<details><summary>Using Nix Flake</summary>


Bundle the package.
```bash
$ nix run .#bundle
```

Start the firehose and companion.
```bash
# Usage: nix run .#dev -- <COMPANION> [<COMPANION> ...]
# Example: nix run .#dev -- kyoko aya
$ nix run .#dev <companion_name>
```

</details>

Bundle the package.
```bash
$ pnpm run bundle
```

```bash
# 1) Start the firehose server (default: http://localhost:8080)
$ pnpm run firehose


# 2) Launch a companion by name (see configs/ directory for available names)
$ pnpm run companion <companion_name>
```

## Acknowledgments

This project is inspired by the research paper:

> **"Who Speaks Next? Multi-party AI Discussion Leveraging the Systematics of Turn-taking in Murder Mystery Games"**  
by Ryota Nonomura and Hiroki Mori (2025)  
📄 [Journal](https://doi.org/10.3389/frai.2025.1582287)

We appreciate their groundbreaking work on multi-agent dialogue systems and turn-taking mechanisms.