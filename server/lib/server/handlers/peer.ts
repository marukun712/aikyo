import type { PeerId } from "@libp2p/interface";
import type { CompanionServer } from "../companionServer.ts";

export const onPeerConnect = async (
  self: CompanionServer,
  evt: CustomEvent<PeerId>,
) => {
  try {
    console.log(`Peer connected: ${evt.detail.toString()}`);
    const metadataMsg = JSON.stringify(self.companion.metadata);
    await self.libp2p.services.pubsub.publish(
      "metadata",
      new TextEncoder().encode(metadataMsg),
    );
  } catch (e) {
    console.error("Error during peer connection:", e);
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

export const publishInitialMetadata = async (self: CompanionServer) => {
  try {
    const metadataMsg = JSON.stringify(self.companion.metadata);
    await self.libp2p.services.pubsub.publish(
      "metadata",
      new TextEncoder().encode(metadataMsg),
    );
    console.log("Initial metadata published");
  } catch (e) {
    console.error("Error publishing initial metadata:", e);
  }
};
