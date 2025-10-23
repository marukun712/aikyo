import {
  type IdentifyResult,
  type Libp2p,
  type PeerId,
  UnsupportedProtocolError,
} from "@libp2p/interface";
import type { LoroMap } from "loro-crdt";
import { logger } from "../../logger.js";
import type { Services } from "../companionServer.js";
import { requestMetadata } from "./metadata.js";

export const onPeerConnect = async (
  companions: LoroMap<Record<string, unknown>>,
  libp2p: Libp2p<Services>,
  evt: CustomEvent<IdentifyResult>,
) => {
  try {
    const peerId = evt.detail.peerId;
    logger.info({ peerId: peerId.toString() }, "Peer connected");
    await requestMetadata(companions, libp2p, peerId);
  } catch (e) {
    if (!(e instanceof UnsupportedProtocolError)) {
      logger.error({ err: e }, "Error during peer connection");
    }
  }
};

export const onPeerDisconnect = async (
  companions: LoroMap<Record<string, unknown>>,
  evt: CustomEvent<PeerId>,
) => {
  try {
    const peerIdStr = evt.detail.toString();
    const metadata = companions.get(peerIdStr);
    if (!metadata) return;
    logger.info({ peerId: peerIdStr, metadata }, "Peer disconnected");
    companions.delete(peerIdStr);
  } catch (e) {
    logger.error({ err: e }, "Error during peer disconnection");
  }
};
