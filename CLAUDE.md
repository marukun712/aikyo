# CLAUDE.md

必ず日本語で回答してください。

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is an AI Companion Protocol system - a distributed microservices architecture for AI companions that can interact with each other and their environment through MQTT messaging. The system consists of 5 core services:

### Core Services

**registry-server** (Port 3000)

- PostgreSQL database with Prisma ORM
- REST API for managing Rooms, Companions, and Furniture
- Database schema: Room → Companions & Furniture (one-to-many relationships)
- Companions have personality, story, sample dialogue, and icon
- Furniture has 3D coordinates (x, y, z) and labels

**companion-server** (Ports 4000, 4001...)

- Each companion runs as a separate service instance
- Mastra.js-based AI agents using Google Gemini 2.5 Flash Lite
- Connected to registry-server for character data and room information
- MQTT client subscribing to "messages" topic for inter-companion communication
- Uses MCP (Model Context Protocol) to communicate with body-server for physical actions
- Memory system with LibSQL for working memory and vector storage

**relay-server** (Port 1883)

- MQTT broker using Aedes
- Handles message routing between companions and body actions
- Two main topics: "messages" (text communication) and "actions" (physical movements)

**body-server** (Port 3001)

- MCP server providing physical action capabilities
- Tools: move(x,y,z), look(x,y,z), gesture(wave/jump/dance/nod/stretch/clap)
- Publishes actions to MQTT "actions" topic for visualization

**control-panel** (Port 8000)

- Next.js web interface for system management
- CRUD operations for rooms, companions, and furniture
- Drag-and-drop interface using @dnd-kit
- Direct API communication with registry-server

**visualization** (Optional)

- Next.js + Three.js VRM viewer for 3D companion visualization
- Subscribes to MQTT actions for real-time companion movement display

### Data Flow

1. Text messages flow: companion → MQTT "messages" → other companions
2. Physical actions flow: companion → body-server (MCP) → MQTT "actions" → visualization
3. Management flow: control-panel ↔ registry-server ↔ database

## Development Commands

### Individual Services

**registry-server, body-server, relay-server:**

```bash
cd [service-directory]
bun install
bun run dev  # or bun index.ts
```

**companion-server:**

```bash
cd companion-server
npm install
npm run dev      # Development
npm run build    # Build with Mastra
npm run start    # Production start
```

**control-panel, visualization:**

```bash
cd [service-directory]
npm install
npm run dev      # Next.js dev server
npm run build    # Production build
npm run lint     # ESLint
```

### Docker Deployment

Full system with PostgreSQL:

```bash
docker-compose up --build
```

Companion instances only:

```bash
docker-compose -f companions.yml up --build
```

### Database Management

```bash
cd registry-server
# Generate Prisma client and Zod schemas
npx prisma generate
# Run migrations
npx prisma migrate dev
# Reset database
npx prisma migrate reset
```

## Configuration

### Environment Variables

**companion-server** requires:

- `COMPANION_ID`: UUID from registry database
- `BODY_SERVER_URL`: MCP endpoint (e.g., http://host.docker.internal:3001/mcp)

**registry-server** requires:

- `DATABASE_URL`: PostgreSQL connection string

### MQTT Topics

- `messages`: JSON format `{from: string, to: string|"all"|"none", message: string}`
- `actions`: Physical actions from body-server tools

## Key Implementation Notes

- Each companion is a separate container instance with unique COMPANION_ID
- Companions fetch their character data and room information from registry-server on startup
- MCP tools require UUID companion ID and coordinate parameters
- The system enforces conversation limits (15 exchanges max) to prevent infinite loops
- Bun runtime is used for TypeScript execution in several services
- Prisma generates both client code and Zod validation schemas
- All services use Zod for runtime validation
- MQTT connections use Docker internal networking (host.docker.internal)
