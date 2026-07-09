const clients = new Set<WebSocket>();
const names = new Map<string, string>();

function log(tag: string, msg: string) {
	console.log(`[${new Date().toISOString()}] [${tag}] ${msg}`);
}

function broadcast(msg: unknown) {
	const data = JSON.stringify(msg);
	for (const client of clients) {
		if (client.readyState === WebSocket.OPEN) client.send(data);
	}
}

Deno.serve({ port: 8080 }, (req) => {
	if (req.headers.get("upgrade") !== "websocket") {
		return new Response("not a websocket", { status: 400 });
	}
	const { socket, response } = Deno.upgradeWebSocket(req);
	clients.add(socket);
	socket.onmessage = (e) => {
		const msg = JSON.parse(e.data);
		if (msg.method === "heartbeat") {
			const { nodeId, displayName, syncState } = msg.params;
			const isNew = !names.has(nodeId);
			names.set(nodeId, displayName);
			log(
				"heartbeat",
				`${displayName} (${nodeId}) sync=${JSON.stringify(syncState)}${isNew ? " [new]" : ""}`,
			);
		} else if (msg.method === "speaker_assign") {
			log(
				"assign",
				`speaker -> ${names.get(msg.params.nodeId) ?? msg.params.nodeId}`,
			);
		} else if (msg.method === "state_request") {
			log("state_request", `tid=${msg.params.tid}`);
		} else if (msg.method === "sync_request") {
			log("sync_request", `fromTid=${msg.params.fromTid}`);
		} else if (msg.method === "speak") {
			const { nodeId, text, nextId } = msg.params;
			const name = names.get(nodeId) ?? nodeId;
			log(
				"speak",
				`${name}${nextId ? ` -> next=${names.get(nextId) ?? nextId}` : ""}`,
			);
			console.log(`\n${name}: ${text}\n`);
		} else {
			log("msg", e.data);
		}
		broadcast(msg);
	};
	socket.onclose = () => clients.delete(socket);
	return response;
});

log("relay", "listening on :8080");
