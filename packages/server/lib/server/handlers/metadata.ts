import type { Connection, Libp2p, PeerId, Stream } from "@libp2p/interface";
import type { LoroMap } from "loro-crdt";
import { type Metadata, MetadataSchema } from "../../../schema/index.js";
import type { Services } from "../companionServer.js";

export const METADATA_PROTOCOL = "/aikyo/metadata/1.0.0";

export async function handleMetadataProtocol(
  metadata: Metadata,
  companions: LoroMap<Record<string, unknown>>,
  { stream, connection }: { stream: Stream; connection: Connection },
) {
  const id = connection.remotePeer.toString();
  if (companions.get(id)) return stream.close();
  await stream.sink([new TextEncoder().encode(JSON.stringify(metadata))]);
  stream.close();
}

export async function requestMetadata(
  companions: LoroMap<Record<string, unknown>>,
  libp2p: Libp2p<Services>,
  peerId: PeerId,
) {
  const id = peerId.toString();
  if (companions.get(id)) return;
  const stream = await libp2p.dialProtocol(peerId, METADATA_PROTOCOL);
  const chunks: Uint8Array[] = [];
  for await (const c of stream.source) chunks.push(c.subarray());
  if (chunks.length) {
    const msg = JSON.parse(new TextDecoder().decode(chunks[0]));
    const parsed = MetadataSchema.safeParse(msg);
    if (parsed.success) companions.set(id, parsed.data);
  }
  stream.close();
}
