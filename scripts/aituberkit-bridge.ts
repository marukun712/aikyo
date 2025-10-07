import { Firehose } from "@aikyo/firehose";

async function createFirehose(port: number, fromName: string) {
  const firehose = new Firehose(port);
  await firehose.start();
  await firehose.subscribe("queries", (data) => {
    if (
      "params" in data &&
      data.params.type === "speak" &&
      data.params.from === fromName &&
      data.params.body &&
      data.params.body.message
    ) {
      const emotion = data.params.body ? data.params.body.emotion : "neutral";

      const transformed = {
        id: data.id,
        text: data.params.body.message,
        role: "assistant",
        emotion,
        type: "message",
      };

      firehose.broadcastToClients(transformed);
    }
  });
  return firehose;
}

async function main() {
  await Promise.all([
    createFirehose(8000, "companion_kyoko"),
    createFirehose(8001, "companion_aya"),
  ]);
}
main().catch(console.error);
