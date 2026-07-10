const clients = new Set<WebSocket>();

function log(tag: string, msg: string) {
	console.log(`[${new Date().toISOString()}] [${tag}] ${msg}`);
}

Deno.serve({ port: 8080 }, (req) => {
	if (req.headers.get("upgrade") !== "websocket") {
		return new Response("not a websocket", { status: 400 });
	}
	const { socket, response } = Deno.upgradeWebSocket(req);
	clients.add(socket);
	log("connect", `total=${clients.size}`);

	socket.onmessage = (e) => {
		const msg = JSON.parse(e.data);
		if (msg.method === "sync_announce") {
			log(
				"announce",
				`state=${msg.params.latestStateTid} msg=${msg.params.latestMessageTid}`,
			);
		} else if (msg.method === "sync_request") {
			log("sync", `type=${msg.params.type} from=${msg.params.fromTid}`);
		}
		// 全クライアントにブロードキャスト
		const data = JSON.stringify(msg);
		for (const client of clients) {
			if (client !== socket && client.readyState === WebSocket.OPEN) {
				client.send(data);
			}
		}
	};

	socket.onclose = () => {
		clients.delete(socket);
		log("disconnect", `total=${clients.size}`);
	};

	return response;
});

log("relay", "listening on :8080");
