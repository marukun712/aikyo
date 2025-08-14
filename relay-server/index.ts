import { createServer as createTCPServer } from "node:net";
import { createServer as createHTTPServer } from "node:http";
import { createBroker } from "aedes";
import websocket from "websocket-stream";

const tcpPort = 1883;
const wsPort = 8883;

const aedes = await createBroker();

const tcpServer = createTCPServer(aedes.handle);
tcpServer.listen(tcpPort, () => {
  console.log("MQTT (TCP) listening on port", tcpPort);
});

const httpServer = createHTTPServer();
websocket.createServer({ server: httpServer }, aedes.handle);
httpServer.listen(wsPort, () => {
  console.log("MQTT over WebSocket listening on port", wsPort);
});
