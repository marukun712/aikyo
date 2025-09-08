import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { createLibp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import { identify } from "@libp2p/identify";
import { mdns } from "@libp2p/mdns";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";

export const initLibp2p = async () => {
  return await createLibp2p({
    addresses: { listen: ["/ip4/0.0.0.0/tcp/0"] },
    transports: [tcp()],
    peerDiscovery: [mdns()],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    services: {
      pubsub: gossipsub({ allowPublishToZeroTopicPeers: true }),
      identify: identify(),
    },
  });
};
