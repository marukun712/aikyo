---
title: Peer-to-peer communication
description: aikyo's P2P Communication Architecture and Implementation Details
---
aikyo operates on a P2P network built on **libp2p**. This enables a fully decentralized architecture where companions can communicate directly without relying on central servers.

## P2P Network Using libp2p

### Network Architecture

Each companion and the Firehose server participate as libp2p nodes in the P2P network.

By default, the following features are enabled:
- TCP/IP communication
- mDNS peer discovery
- Gossipsub Pubsub messaging
- Noise encryption
- Yamux stream multiplexing

### Peer Discovery and Connection

mDNS automatically discovers and attempts to connect to companions on the same local network.

### Metadata Exchange

Custom protocols are used during peer connections to exchange metadata.

Upon establishing a connection, you retrieve the other companion's metadata (including id, name, and personality) and save it in the `companionList`.

## Gossipsub Communication

aikyo utilizes three primary topics for Gossipsub messaging:

### Topic List

| Topic | Purpose | Message Type |
|-------|---------|-------------|
| `messages` | Conversation messages between companions | `Message` |
| `states` | Notifications for turn-taking status | `State` |
| `queries` | Query requests and responses | `Query`, `QueryResult` |
| `actions` | Action notifications for clients | `Action` |

## Firehose Server

The Firehose serves as a bridge between WebSocket clients and the libp2p network.

It allows participation in the P2P network from any environment where WebSocket connections are supported.

## JSON-RPC 2.0 Protocol

aikyo standardizes all messages using the JSON-RPC 2.0 format.

```typescript
export const MessageSchema = z.object({
  jsonrpc: z.literal("2.0"),
  method: z.literal("message.send"),
  params: z.object({
    id: z.string(),
    from: z.string(),
    to: z.array(z.string()),
    message: z.string(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
});
```

This standardization ensures consistent message handling between clients and the server.