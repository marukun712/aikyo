import { createServer as createHTTPServer } from "node:http";
import { createServer as createTCPServer } from "node:net";
import { createBroker } from "aedes";
import { WebSocketServer, createWebSocketStream } from "ws";

const tcpPort = 1883;
const wsPort = 8883;

const aedes = await createBroker();

const tcpServer = createTCPServer(aedes.handle);
tcpServer.listen(tcpPort, () => {
  console.log("MQTT TCP server listening on port", tcpPort);
});

const httpServer = createHTTPServer();
const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (websocket, req) => {
  const stream = createWebSocketStream(websocket);
  aedes.handle(stream, req);
});

httpServer.listen(wsPort, () => {
  console.log("MQTT WebSocket server listening on port", wsPort);
});
