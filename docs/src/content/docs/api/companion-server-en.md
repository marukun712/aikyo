---
title: Companion Server
description: API reference for the CompanionServer class
---
The `CompanionServer` class provides P2P server functionality for companions, integrating management of libp2p nodes, messaging, turn-taking, and metadata exchange.

## Import Statement

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

| Parameter       | Type           | Description                                               | Default Value    |
|-----------------|----------------|-----------------------------------------------------------|------------------|
| `companionAgent` | `CompanionAgent` | Instance of the companion agent                           | -                |
| `history`       | `Message[]`    | Array of conversation history (must reference the same array as CompanionAgent) | -                |
| `config`        | `object`       | Optional configuration settings                            | `{ timeoutDuration: 5000 }` |
| `config.timeoutDuration` | `number` | Delay in milliseconds before allowing another turn after a turn-taking event | `5000`           |
| `libp2pConfig`  | `Libp2pOptions<Services>` | Optional: Custom configuration for the libp2p node       | -                |

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

When using custom libp2p configuration, you must provide the full configuration settings.

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

Manager responsible for handling turn-taking. See [Turn-Taking](../core/turn-taking) for details.

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

Instance of the libp2p node. The core object responsible for P2P communication.

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

First registers itself, then adds the other party's metadata when peer connections are established.

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

Map managing the state of client query requests. For details, see [Query](../tools/query#managing-pendingqueries).

### libp2pConfig

```typescript
libp2pConfig?: Libp2pOptions<Services>
```

Optional: Custom configuration for the libp2p node. If not specified, default settings will be used.

## Methods

### start()

Starts the server.

```typescript
async start(): Promise<void>
```

**Process Flow:**

1. Initializes the libp2p node (`setupLibp2p()`)
2. Registers event listeners

### handleMessageReceived()

Handles incoming messages.

```typescript
async handleMessageReceived(message: Message): Promise<void>
```

**Parameter:**

- `message`: The received message

**Process Flow:**

1. Registers the message with the `TurnTakingManager`
2. Generates the local `State` object
3. Publishes the State to the `states` topic

This method is called from `handlePubSubMessage`.