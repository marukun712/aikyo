# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Companion Protocol is an MQTT-based distributed network system where multiple AI companions operate collaboratively. Each AI companion runs as an independent server and exchanges real-time messages and actions through an MQTT broker.

## Development Commands

### Registry Server (Port 3000)
```bash
cd registry-server
bun run dev  # Start development server
```

### Relay Server (Port 1883) 
```bash
cd relay-server
bun run dev  # Start MQTT broker
```

### Body Server (Port 8001)
```bash
cd body-server
bun run dev  # Start MCP server for physical actions
```

### Companion Server (Port 4000)
```bash
cd companion-server
export COMPANION_ID="target-companion-uuid"
npm run dev    # Start development server
npm run build  # Build using Mastra
npm start      # Start production server
```

## System Architecture

### 4-Server Distributed Design

1. **Registry Server**: Manages AI companion metadata from `/agents/*.json` files and serves them via `/metadata` endpoint
2. **Relay Server**: MQTT broker (Aedes) handling `messages` and `actions` topics
3. **Body Server**: MCP server providing physical action tools (move, look, animation)
4. **Companion Server**: Individual AI brain using Mastra Framework + Anthropic Claude

### Message Flow Architecture

- **MQTT Topics**: `messages` for inter-companion communication, `actions` for physical behaviors
- **Message Schema**: `{from: companionId, to: companionId|"all", message: string}`
- **Action Schema**: `{from: companionId, name: actionName, params: object}`

### Key Technologies

- **Runtime**: Bun for Registry/Relay/Body servers, Node.js for Companion server
- **AI Framework**: Mastra with Anthropic Claude 3.5 Haiku
- **Database**: LibSQL for memory storage and vector embeddings
- **Communication**: MQTT for real-time messaging, MCP for body actions
- **Validation**: Zod schemas throughout

## Important Implementation Details

### Companion Agent Configuration
- Must set `COMPANION_ID` environment variable to target companion UUID
- Agent fetches metadata from Registry Server on startup (`http://localhost:3000/metadata`)
- Character personality loaded from `/agents/*.json` files with strict schema validation
- Memory system enabled with working memory for conversation context

### Body Server Integration
- Provides 3 MCP tools: `move` (3D coordinates), `look` (gaze direction), `animation` (text-to-motion via external API)
- All actions published to MQTT `actions` topic for client consumption
- External motion generation API at `http://100.73.74.135:8000/t2m`

### Message Processing Logic
- Companions only process messages where `to` field matches their ID or equals "all"
- 10-second delay built into message sending to prevent spam
- Conversation limit of 15 exchanges enforced
- No emoji usage allowed in companion responses

### Character Definition Schema
Located in `/agents/*.json`:
```json
{
  "metadata": {
    "id": "uuid",
    "name": "character name", 
    "personality": "description",
    "story": "background",
    "sample": "sample dialogue",
    "version": "1.0.0",
    "author": "creator",
    "tags": ["tag1", "tag2"],
    "icon": "url"
  }
}
```

## Development Workflow

1. Start servers in order: Registry → Relay → Body → Companion
2. Ensure MQTT broker (port 1883) is running before starting any dependent servers
3. Registry Server must be accessible for companion initialization
4. Each companion requires unique COMPANION_ID matching an agent file UUID
5. Body Server external motion API dependency may require network access to `100.73.74.135:8000`

## Codebase Patterns

- TypeScript throughout with strict type checking via Zod schemas
- Error handling with try/catch blocks and structured error responses
- Express.js for HTTP servers, Hono for lightweight routing
- MCP protocol implementation for tool integration
- MQTT client/server pattern for distributed communication
- Memory management through Mastra's LibSQL integration