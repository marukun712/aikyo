import { Firehose } from "@aikyo/firehose";

const firehose = new Firehose(8080);
await firehose.start();

await firehose.subscribe("messages", (data) => {
  firehose.broadcastToClients(data);
});

await firehose.subscribe("queries", (data) => {
  firehose.broadcastToClients(data);
});

await firehose.subscribe("actions", (data) => {
  firehose.broadcastToClients(data);
});
