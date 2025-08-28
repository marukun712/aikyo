import { Hono } from "hono";
import { validator } from "hono/validator";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { createLibp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import { identify } from "@libp2p/identify";
import { mdns } from "@libp2p/mdns";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { MessageSchema, MetadataSchema, type Metadata } from "@aikyo/server";
import { serve } from "@hono/node-server";

const app = new Hono();
const port = Number(process.env.ROUTER_PORT) ?? 4000;
const companionList = new Map<string, Metadata>();

const libp2p = await createLibp2p({
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

libp2p.addEventListener("peer:discovery", (evt) => {
  libp2p.dial(evt.detail.multiaddrs).catch((err) => {
    console.error("Dial error:", err);
  });
});

libp2p.addEventListener("peer:identify", async (evt) => {
  try {
    const { agentVersion, peerId } = evt.detail;
    if (!agentVersion) return;
    const parsed = MetadataSchema.safeParse(JSON.parse(agentVersion));
    if (companionList.has(peerId.toString()) || !parsed.success) return;
    companionList.set(peerId.toString(), parsed.data);
    console.log(
      `Identified peer ${peerId.toString()} with metadata:`,
      agentVersion,
    );
  } catch (e) {}
});

libp2p.addEventListener("peer:disconnect", async (evt) => {
  try {
    const peerIdStr = evt.detail.toString();
    const agentVersion = companionList.get(peerIdStr);
    if (!companionList.has(peerIdStr)) return;
    console.log(`Peer disconnected: ${peerIdStr}, metadata was:`, agentVersion);
    companionList.delete(peerIdStr);
  } catch (e) {}
});

app.post(
  "/router",
  validator("json", (value, c) => {
    const parsed = MessageSchema.safeParse(value);
    if (!parsed.success) return c.text("Invalid body!", 400);
    return parsed.data;
  }),
  async (c) => {
    const body = c.req.valid("json");
    libp2p.services.pubsub.publish(
      "messages",
      new TextEncoder().encode(JSON.stringify(body, null, 2)),
    );
    const target = Array.from(companionList.entries()).find(
      ([k, v]) => v.id === body.to,
    );
    if (!target) return c.json({ error: "Companion not found!" }, 404);
    const rawUrl = target[1].url;
    const url = new URL(rawUrl);
    const res = await fetch(`${url.href}generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) return c.json({ error: "Failed to send message!" }, 500);
    const json = await res.json();
    const parsed = MessageSchema.safeParse(json);
    if (!parsed.success) return c.json({ error: "Invalid response!" }, 500);
    libp2p.services.pubsub.publish(
      "messages",
      new TextEncoder().encode(JSON.stringify(parsed.data, null, 2)),
    );
    return c.json(parsed.data, 200);
  },
);

serve({ fetch: app.fetch, port });
console.log(`Router running on http://localhost:${port}`);
