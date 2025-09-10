import {
  type IdentifyResult,
  type PeerId,
  UnsupportedProtocolError,
} from "@libp2p/interface";
import type { CompanionServer } from "../companionServer.ts";
import { requestMetadata } from "./metadata.ts";

export const onPeerConnect = async (
  self: CompanionServer,
  evt: CustomEvent<IdentifyResult>,
) => {
  try {
    const peerId = evt.detail.peerId;
    console.log(`Peer connected: ${peerId.toString()}`);
    await requestMetadata(self, peerId);
  } catch (e) {
    if (!(e instanceof UnsupportedProtocolError)) {
      console.error("Error during peer connection:", e);
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
    console.log(`Peer disconnected: ${peerIdStr}, metadata was:`, metadata);
    self.companionList.delete(peerIdStr);
  } catch (e) {
    console.error(e);
  }
};
