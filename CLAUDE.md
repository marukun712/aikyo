# CLAUDE.md

必ず日本語で回答してください。

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Starting Services

- `task run` - Start the full aikyo system with ASCII art banner
- `npm run companion --config=<config-name>` - Start a companion with specific config (e.g., `polka`, `china`, `hanabi`, `mai`)
- `npm run firehose` - Start the P2P WebSocket bridge server
- `task companion -- <config-name>` - Alternative way to start companion via Taskfile

**Note**: The `npm run router` script exists in package.json but the routing directory is not present

### Code Quality

- `npm run format` - Format code with Prettier
- `npm run lint` - Lint code with oxlint

### Environment Setup

- Copy `.env.example` to `.env` and configure required environment variables:
  - `ROUTER_PORT` - Port for routing service (default: 4000)
  - `FIREHOSE_PORT` - Port for P2P bridge server (default: 8080)
  - `ANTHROPIC_API_KEY` - Required for AI model integration

### Available Companion Configs

The system supports multiple pre-configured companions in the `configs/` directory:

- `polka` - 高橋ポルカ character
- `china` - China character configuration
- `hanabi` - Hanabi character configuration
- `mai` - Mai character configuration

## Architecture Overview

aikyo is a framework for creating interconnected AI companions that communicate over P2P networks.

### Core Components

1. **Companion Server** (`server/`) - Core server library for running AI companions
   - `CompanionAgent` - Main agent class that handles AI model integration
   - `CompanionServer` - HTTP server for companion interactions
   - Exports agents, server, and schema modules

2. **Firehose** (`firehose/index.ts`) - P2P to WebSocket bridge
   - Creates libp2p node with GossipSub for P2P messaging
   - Runs WebSocket server to bridge P2P network to web clients
   - Subscribes to topics: `messages`, `actions`, `contexts`
   - Default port: 8080 (configurable via `FIREHOSE_PORT`)

3. **Companion Configurations** (`configs/`) - Character definitions
   - Each config defines a `CompanionCard` with personality, actions, and knowledge
   - Uses OpenRouter for AI model integration (Gemini 2.0 Flash)
   - Includes event-driven behavior with CEL expressions

### P2P Network Architecture

The system uses libp2p with the following stack:

- **Transport**: TCP
- **Peer Discovery**: mDNS for local network discovery
- **Encryption**: Noise protocol
- **Multiplexing**: Yamux
- **Pub/Sub**: GossipSub with three main topics:
  - `messages` - Inter-companion communication
  - `actions` - Physical movement/gesture data
  - `contexts` - Shared situational awareness

### Message Types

1. **message** - Communication between companions or humans
2. **action** - Physical movements/gestures (broadcast only)
3. **context** - Shared situational information

### Companion Card Structure

Each companion is defined by a `CompanionCard` containing:

- **metadata**: ID, URL, name, personality, story, sample dialogue
- **role**: System prompt defining the companion's behavior
- **actions**: Available tools for the companion (e.g., gestures, context sharing)
- **knowledge**: Dynamic knowledge retrieval tools
- **events**: Conditional logic using CEL expressions to trigger actions

### Workspaces

The project uses npm workspaces:

- `server` - Core companion server library
- `firehose` - P2P bridge service
- `configs` - Companion configurations
- `apm_tools` - Action and knowledge tools
- `packages/utils` - Shared utilities
- `docs` - Documentation site (Astro-based)

### Key Dependencies

- **Mastra** - Core AI framework (`@mastra/core`, `@mastra/mcp`, etc.)
- **Hono** - Web framework for HTTP servers
- **libp2p** - P2P networking stack with GossipSub for pub/sub messaging
- **CEL-js** - Common Expression Language for event-driven logic
- **Zod** - Schema validation and TypeScript type inference
- **OpenRouter** - AI model API integration (Gemini 2.0 Flash)

### Development Notes

- The system requires Node.js >=20.9.0 (specified in server/package.json)
- Uses TypeScript with `tsx` for development
- Environment variables are loaded from `.env` file
- All companions must have IDs starting with `companion_`
- User IDs must start with `user_`
- The system supports both local P2P networking and external API integrations
- No test suite currently configured in the main project
