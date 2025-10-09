---
title: Firehose
description: API Reference for the Firehose Class
---
`Firehose` is a server that bridges WebSocket clients with libp2p Pubsub, enabling browsers and Node.js clients to participate in a P2P network.

## Import

```typescript
import { Firehose } from "@aikyo/firehose";
```

## Constructor

```typescript
constructor(port: number, libp2pConfig?: Libp2pOptions<Services>)
```

### Parameters

| Parameter | Type          | Description                               |
|-----------|---------------|-------------------------------------------|
| `port`    | `number`      | Port number for the WebSocket server     |
| `libp2pConfig` | `Libp2pOptions<Services>` | Optional. Custom configuration for the libp2p node                   |

### Usage Example

```typescript
import { Firehose } from "@aikyo/firehose";

const firehose = new Firehose(8080);
await firehose.start();

// Subscribe to each topic
await firehose.subscribe("messages", (data) => {
  firehose.broadcastToClients(data);
});

await firehose.subscribe("queries", (data) => {
  firehose.broadcastToClients(data);
});

await firehose.subscribe("actions", (data) => {
  firehose.broadcastToClients(data);
});
```

Client Example:
```typescript
import WebSocket from 'ws';

const firehoseUrl = 'ws://localhost:8080';
const ws = new WebSocket(firehoseUrl);

const companionId = 'companion_aya'; // Specify Aya's ID
const userId = 'user_yamada';        // Specify the user's name

ws.on('open', () => {
  const message = {
    topic: "messages",
    body: {
      jsonrpc: '2.0',
      method: 'message.send',
      params: {
        id: crypto.randomUUID(),
        from: userId,
        to: [companionId],
        message: 'Hello Aya!',
      }
    }
  };

  ws.send(JSON.stringify(message));
});

ws.on('message', (data) => {
  console.log(JSON.parse(data.toString()));
});
```

For using custom libp2p configuration, you must provide complete settings.

```typescript
import { Firehose } from "@aikyo/firehose";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import { mdns } from "@libp2p/mdns";
import { tcp } from "@libp2p/tcp";

const customFirehose = new Firehose(8080, {
  addresses: { listen: ["/ip4/0.0.0.0/tcp/9000"] },
  transports: [tcp()],
  peerDiscovery: [mdns()],
  connectionEncrypters: [noise()],
  streamMuxers: [yamux()],
  services: {
    pubsub: gossipsub({ allowPublishToZeroTopicPeers: true }),
    identify: identify(),
  },
});
await customFirehose.start();
```

## Properties

### libp2p

```typescript
private libp2p: Libp2p<Services>
```

Instance of the libp2p node (configured similarly to CompanionServer).

```typescript
this.libp2p = await createLibp2p({
  addresses: {
    listen: ["/ip4/0.0.0.0/tcp/0"],
  },
  transports: [tcp()],
  peerDiscovery: [mdns()],
  connectionEncrypters: [noise()],
  streamMuxers: [yamux()],
  services: {
    pubsub: gossipsub({ allowPublishToZeroTopicPeers: true }),
    identify: identify(),
  },
});
```

### wss

```typescript
private wss: WebSocketServer
```

Instance of the WebSocket server.

```typescript
this.wss = new WebSocketServer({ port: this.port });
```

### clients

```typescript
private clients: Set<WebSocket>
```

Set managing connected WebSocket clients.

```typescript
this.clients = new Set();
```

New clients are added when they connect and removed when disconnecting.

### port

```typescript
private readonly port: number
```

Port number for the WebSocket server.

### topicHandlers

```typescript
private topicHandlers: {
  [K in keyof TopicPayloads]: ((data: TopicPayloads[K]) => void)[];
}
```

Object managing handler functions for each topic, providing type-safe event handling.

```typescript
type TopicPayloads = {
  messages: Message;
  queries: Query | QueryResult;
  actions: Action;
  states: State;
};
```

Multiple handlers can be registered for each topic and will be executed sequentially when messages are received.

### libp2pConfig

```typescript
private libp2pConfig?: Libp2pOptions<Services>
```

Optional. Custom configuration for the libp2p node. If not specified, default settings will be used.

## Methods

### start()

Starts the Firehose server.

```typescript
async start(): Promise<void>
```

**Process Flow:**

1. Initializes the libp2p node
2. Starts the WebSocket server
3. Registers event listeners

**Example Output:**

```
aikyo firehose server running on ws://localhost:8080
```

### subscribe()

Subscribes to specified topics and optionally registers handlers.

```typescript
async subscribe<K extends keyof TopicPayloads>(
  topic: K,
  handler?: (data: TopicPayloads[K]) => void
): Promise<void>
```

**Parameters:**

| Parameter | Type          | Description                               |
|-----------|---------------|-------------------------------------------|
| `topic`   | `keyof TopicPayloads` | Name of the topic to subscribe to ("messages", "queries", "actions", "states") |
| `handler` | `function`    | Optional. Handler function to execute when messages are received                 |

**Usage Example:**

```typescript
// Subscribe to a topic only
await firehose.subscribe("messages");

// Subscribe with a handler
await firehose.subscribe("messages", (data) => {
  console.log("Message received:", data);
  firehose.broadcastToClients(data);
});
```

### addHandler()

Adds a handler to an existing topic.

```typescript
addHandler<K extends keyof TopicPayloads>(
  topic: K,
  handler: (data: TopicPayloads[K]) => void
): void
```

**Parameters:**

| Parameter | Type          | Description                               |
|-----------|---------------|-------------------------------------------|
| `topic`   | `keyof TopicPayloads` | Topic name                                |
| `handler` | `function`    | Handler function to execute when messages are received                       |

**Usage Example:**

```typescript
firehose.addHandler("actions", (action) => {
  console.log("Action received:", action);
});
```

### broadcastToClients()

Broadcasts data to all connected WebSocket clients.

```typescript
broadcastToClients(data: unknown): void
```

**Parameters:**

| Parameter | Type          | Description                               |
|-----------|---------------|-------------------------------------------|
| `data`    | `unknown`     | Data to broadcast (will be JSON.stringified) |