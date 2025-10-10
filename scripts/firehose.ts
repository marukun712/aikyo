import { Firehose } from "@aikyo/firehose";

const firehose = new Firehose(8080);
await firehose.start();

await firehose.subscribe("messages", (data) => {
  console.log(data);
  firehose.broadcastToClients(data);
});

await firehose.subscribe("queries", (data) => {
  console.log(data);
  firehose.broadcastToClients(data);
});

await firehose.subscribe("actions", (data) => {
  console.log(data);
  firehose.broadcastToClients(data);
});

await firehose.subscribe("states", (data) => {
  console.log(data);
  firehose.broadcastToClients(data);
});
