import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import { mdns } from "@libp2p/mdns";
import { tcp } from "@libp2p/tcp";
import type { Libp2pOptions } from "libp2p";
import type { Services } from "../companionServer";

export function mergeConfig(libp2pConfig: Libp2pOptions<Services> | undefined) {
  const defaultConfig: Libp2pOptions<Services> = {
    addresses: { listen: ["/ip4/0.0.0.0/tcp/0"] },
    transports: [tcp()],
    peerDiscovery: [mdns()],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    services: {
      pubsub: gossipsub({
        allowPublishToZeroTopicPeers: true,
        emitSelf: true,
      }),
      identify: identify(),
    },
  };

  if (!defaultConfig.services)
    throw new Error("Error: Gossipsubの設定が構成されていません！");

  return {
    ...defaultConfig,
    ...libp2pConfig,
    addresses: {
      ...defaultConfig.addresses,
      ...libp2pConfig?.addresses,
    },
    transports: libp2pConfig?.transports ?? defaultConfig.transports,
    peerDiscovery: libp2pConfig?.peerDiscovery ?? defaultConfig.peerDiscovery,
    connectionEncrypters:
      libp2pConfig?.connectionEncrypters ?? defaultConfig.connectionEncrypters,
    streamMuxers: libp2pConfig?.streamMuxers ?? defaultConfig.streamMuxers,
    services: {
      ...defaultConfig.services,
      ...libp2pConfig?.services,
    },
  };
}
