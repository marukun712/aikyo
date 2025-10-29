import type { Connection, PeerId, Stream } from "@libp2p/interface";
import { MetadataSchema } from "../../../schema/index.js";
import { logger } from "../../logger.js";
import type { CompanionServer } from "../companionServer.js";

export const METADATA_PROTOCOL = "/aikyo/metadata/1.0.0";

export async function handleMetadataProtocol(
  self: CompanionServer,
  { stream, connection }: { stream: Stream; connection: Connection },
) {
  const id = connection.remotePeer.toString();
  if (self.companionList.has(id)) return stream.close();
  await stream.sink([
    new TextEncoder().encode(JSON.stringify(self.card.metadata)),
  ]);
  stream.close();
}

export async function requestMetadata(self: CompanionServer, peerId: PeerId) {
  const id = peerId.toString();
  if (self.companionList.has(id)) return;
  const stream = await self.libp2p.dialProtocol(peerId, METADATA_PROTOCOL);
  const chunks: Uint8Array[] = [];
  for await (const c of stream.source) chunks.push(c.subarray());
  if (chunks.length) {
    const msg = JSON.parse(new TextDecoder().decode(chunks[0]));
    const parsed = MetadataSchema.safeParse(msg);
    logger.debug({ parsed }, "Received metadata from peer");
    if (parsed.success) self.companionList.set(id, parsed.data);
  }
  stream.close();
}
