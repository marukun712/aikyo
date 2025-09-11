import { Firehose } from "@aikyo/firehose";

const firehose = new Firehose(8080);
await firehose.start();
