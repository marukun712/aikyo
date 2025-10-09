---
title: Query (query system)
description: aikyo's client ↔ companion bidirectional communication system
---
**Query** is a mechanism enabling bidirectional communication between companions and clients. It allows companions to request information from clients and receive the results.

## Features of Queries

- **Bidirectional Communication**: Roundtrip communication from companion → client → companion
- **Asynchronous Processing**: Results are awaited using Promise-based mechanisms
- **Timeout Functionality**: Automatically times out if no response is received
- **Flexible Data Handling**: Supports sending and receiving requests/responses in any JSON format

## Query and QueryResult Types

### Query Type

```typescript
export const QuerySchema = z.object({
  jsonrpc: z.literal("2.0"),
  method: z.literal("query.send"),
  id: z.string(),
  params: z.object({
    from: z.string(),
    type: z.string(),
    body: z.record(z.string(), z.any()).optional(),
  }),
});
export type Query = z.infer<typeof QuerySchema>;
```

| Field       | Type     | Description                          |
|-------------|---------|--------------------------------------|
| `jsonrpc`   | `"2.0"` | JSON-RPC version                     |
| `method`    | `"query.send"` | Method name                          |
| `id`        | `string`   | Unique query identifier (linked to response) |
| `params.from` | `string` | Identifier of the sending companion      |
| `params.type` | `string` | Type of query (e.g., `"vision"`, `"speak"`)    |
| `params.body` | `object` | Additional data (optional)            |

### QueryResult Type

```typescript
export const QueryResultSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.string(),
  result: z
    .object({
      success: z.boolean(),
      body: z.record(z.string(), z.any()),
    })
    .optional(),
  error: z.string().optional().describe("Error message"),
});
export type QueryResult = z.infer<typeof QueryResultSchema>;
```

| Field       | Type     | Description                          |
|-------------|---------|--------------------------------------|
| `jsonrpc`   | `"2.0"` | JSON-RPC version                     |
| `id`        | `string` | Query identifier (matches Query)       |
| `result`    | `object` | Success response data (optional)      |
| `result.success` | `boolean` | Success/failure flag               |
| `result.body` | `object` | Response data                        |
| `error`     | `string` | Error message (optional)              |

## sendQuery Function

The `sendQuery` function sends a Query and waits for a QueryResult.

**Parameters:**

- `query`: The Query to be sent
- `timeout`: Timeout duration in milliseconds (default 30000)

**Return Value:**

- `Promise<QueryResult>`: Response from the client

### Timeout Handling

If no response is received from the client within the specified `timeout` period, the Promise will be rejected.

## Managing pendingQueries

The `CompanionServer` maintains the state of pending queries using a `pendingQueries` Map.

**Processing upon receiving a QueryResult:**

1. Receives the QueryResult on the `queries` topic
2. Searches for the corresponding query in the `pendingQueries` map
3. Callers `resolve` to complete the Promise
4. Removes the entry from the `pendingQueries` map