---
title: Query (query system)
description: AIKYO client ↔ companion bidirectional communication system
---
The **Query** mechanism enables bidirectional communication between companions and clients. It allows companions to request information from clients and receive the results.

## Features of Query

- **Bidirectional Communication**: Supports round-trip communication from companion → client → companion.
- **Asynchronous Processing**: Uses Promise-based approach to handle asynchronous result waiting.
- **Timeout Functionality**: Automatically times out if no response is received within the specified duration.
- **Flexible Data Handling**: Can send and receive requests/responses in any JSON format.

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

| Field       | Type     | Description                           |
|-------------|---------|---------------------------------------|
| `jsonrpc`   | `"2.0"` | JSON-RPC version                      |
| `method`    | `"query.send"` | Method name                           |
| `id`        | `string`  | Unique identifier for the query (linked to response) |
| `params.from` | `string` | Identifier of the sending companion    |
| `params.type` | `string` | Type of query (e.g., `"vision"`, `"speak"`) |
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

| Field       | Type     | Description                           |
|-------------|---------|---------------------------------------|
| `jsonrpc`   | `"2.0"` | JSON-RPC version                      |
| `id`        | `string` | Query identifier (matches Query)      |
| `result`    | `object` | Response data when successful (optional) |
| `result.success` | `boolean` | Success/failure flag               |
| `result.body` | `object` | Response content                     |
| `error`     | `string` | Error message if failure occurs (optional) |

## sendQuery Function

The `sendQuery` function sends a Query and waits for the associated QueryResult.

**Parameters:**

- `query`: The Query to be sent
- `timeout`: Timeout duration in milliseconds (default 30000)

**Return Value:**

- `Promise<QueryResult>`: Response from the client

### Timeout Handling

If no response is received from the client within the specified `timeout` period, the Promise will be rejected.

## Managing pendingQueries

The `CompanionServer` uses a `pendingQueries` Map to track querys that are awaiting responses.

**Processing upon receiving a QueryResult:**

1. Receives the QueryResult on the `queries` topic
2. Locates the corresponding query in the `pendingQueries` map
3. Calls `resolve` to complete the Promise
4. Removes the entry from the `pendingQueries` map