import {
  type IdentifyResult,
  type PeerId,
  UnsupportedProtocolError,
} from "@libp2p/interface";
import { logger } from "../../logger.js";
import type { CompanionServer } from "../companionServer.js";
import { requestMetadata } from "./metadata.js";

export const onPeerConnect = async (
  self: CompanionServer,
  evt: CustomEvent<IdentifyResult>,
) => {
  try {
    const peerId = evt.detail.peerId;
    logger.info({ peerId: peerId.toString() }, "Peer connected");
    await requestMetadata(self, peerId);
  } catch (e) {
    if (!(e instanceof UnsupportedProtocolError)) {
      logger.error({ err: e }, "Error during peer connection");
    }
  }
};

export const onPeerDisconnect = async (
  self: CompanionServer,
  evt: CustomEvent<PeerId>,
) => {
  try {
    const peerIdStr = evt.detail.toString();
    const metadata = self.companionList.get(peerIdStr);
    if (!self.companionList.has(peerIdStr)) return;
    logger.info({ peerId: peerIdStr, metadata }, "Peer disconnected");
    self.companionList.delete(peerIdStr);
  } catch (e) {
    logger.error({ err: e }, "Error during peer disconnection");
  }
};
