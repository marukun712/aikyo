import type { gossipsub } from "@chainsafe/libp2p-gossipsub";
import type { identify } from "@libp2p/identify";

export type Services = {
  pubsub: ReturnType<ReturnType<typeof gossipsub>>;
  identify: ReturnType<ReturnType<typeof identify>>;
};
