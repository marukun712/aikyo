---
title: Companion Server
description: API reference for the CompanionServer class
---
The `CompanionServer` class provides the P2P server functionality for companions. It integrates management of libp2p nodes, messaging, turn-taking, and metadata exchange.

## Imports

```typescript
import { CompanionServer } from "@aikyo/server";
```

## Constructor

```typescript
constructor(
  companionAgent: CompanionAgent,
  history: Message[],
  config?: { timeoutDuration: number },
  libp2pConfig?: Libp2pOptions<Services>
)
```

### Parameters

| Parameter | Type                   | Description                                               | Default Value |
|-----------|------------------------|-----------------------------------------------------------|---------------|
| `companionAgent` | `CompanionAgent`       | Instance of the companion agent                           | -             |
| `history` | `Message[]`            | Array of conversation history (must reference the same array as CompanionAgent) | -             |
| `config` | `object`               | Optional configuration settings                           | `{ timeoutDuration: 5000 }` |
| `config.timeoutDuration` | `number` | Delay in milliseconds before allowing another turn after a turn-taking event | `5000`       |
| `libp2pConfig` | `Libp2pOptions<Services>` | Optional: Custom configuration for the libp2p node           | -             |

### Usage Example

```typescript
import { CompanionAgent, CompanionServer, type Message } from "@aikyo/server";
import { anthropic } from "@ai-sdk/anthropic";

const history: Message[] = [];

const companion = new CompanionAgent(
  companionCard,
  anthropic("claude-3-5-haiku-latest"),
  history
);

const server = new CompanionServer(companion, history, {
  timeoutDuration: 1000
});

await server.start();
```

When using custom libp2p configuration, you must provide complete settings.

```typescript
import { CompanionAgent, CompanionServer, type Message } from "@aikyo/server";
import { anthropic } from "@ai-sdk/anthropic";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import { mdns } from "@libp2p/mdns";
import { tcp } from "@libp2p/tcp";

const history: Message[] = [];
const companion = new CompanionAgent(
  companionCard,
  anthropic("claude-3-5-haiku-latest"),
  history
);

const customServer = new CompanionServer(
  companion,
  history,
  {
    timeoutDuration: 1000
  },
  {
    addresses: { listen: ["/ip4/0.0.0.0/tcp/9000"] },
    transports: [tcp()],
    peerDiscovery: [mdns()],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    services: {
      pubsub: gossipsub({
        allowPublishToZeroTopicPeers: true,
        emitSelf: true,
      }),
      identify: identify(),
    },
  }
);

await customServer.start();
```

## Properties

### companionAgent

```typescript
companionAgent: CompanionAgent
```

Instance of the companion agent.

### history

```typescript
history: Message[]
```

Array of conversation history (reference).

### turnTakingManager

```typescript
turnTakingManager: TurnTakingManager
```

Manager responsible for handling turn-taking. For details, see [Turn-Taking](../core/turn-taking).

```typescript
this.turnTakingManager = new TurnTakingManager(
  this.companionAgent,
  config ? config.timeoutDuration : 5000,
);
```

### companion

```typescript
companion: CompanionCard
```

Configuration card for the companion (same as `companionAgent.companion`).

### libp2p

```typescript
libp2p: Libp2p<Services>
```

Instance of the libp2p node. This serves as the core object for P2P communication.

```typescript
this.libp2p = await createLibp2p({
  addresses: { listen: ["/ip4/0.0.0.0/tcp/0"] },
  transports: [tcp()],
  peerDiscovery: [mdns()],
  connectionEncrypters: [noise()],
  streamMuxers: [yamux()],
  services: {
    pubsub: gossipsub({
      allowPublishToZeroTopicPeers: true,
      emitSelf: true,
    }),
    identify: identify(),
  },
});
```

For details, see [P2P Communication](../core/p2p).

### companionList

```typescript
companionList: Map<string, Metadata>
```

Map managing metadata for connected companions.

```typescript
companionList = new Map<string, Metadata>();
```

**During initialization:**

First, register yourself, then add the other party's metadata when connecting peers.

### pendingQueries

```typescript
pendingQueries = new Map<
  string,
  {
    resolve: (value: QueryResult) => void;
    reject: (reason: string) => void;
  }
>();
```

Map managing the state of pending queries to clients. For details, see [Query](../tools/query#managing-pendingqueries).

### libp2pConfig

```typescript
libp2pConfig?: Libp2pOptions<Services>
```

Optional: Custom configuration for the libp2p node. If omitted, default settings are used.

## Methods

### start()

Starts the server.

```typescript
async start(): Promise<void>
```

**Processing Flow:**

1. Initialize the libp2p node (`setupLibp2p()`)
2. Register event listeners

### handleMessageReceived()

Handles the reception of messages.

```typescript
async handleMessageReceived(message: Message): Promise<void>
```

**Parameters:**

- `message`: The received message

**Processing Flow:**

1. Register the message with the `TurnTakingManager`
2. Generate your own `State`
3. Publish the State to the `states` topic

This method is called from `handlePubSubMessage`.
