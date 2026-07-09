import { start } from "./src/mcp.ts";
import { WebSocketTransport } from "./src/transport.ts";

const displayName = Deno.args[0] ?? "agent";
const relayUrl = Deno.args[1] ?? "ws://localhost:8080";

const transport = new WebSocketTransport(relayUrl);
await transport.waitForOpen();

await start(displayName, transport);
