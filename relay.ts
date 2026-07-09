const clients = new Set<WebSocket>();

Deno.serve({ port: 8080 }, (req) => {
	if (req.headers.get("upgrade") !== "websocket") {
		return new Response("not a websocket", { status: 400 });
	}
	const { socket, response } = Deno.upgradeWebSocket(req);
	clients.add(socket);
	socket.onmessage = (e) => {
		for (const client of clients) {
			if (client.readyState === WebSocket.OPEN) {
				console.log(JSON.stringify(e.data));
				client.send(e.data);
			}
		}
	};
	socket.onclose = () => clients.delete(socket);
	return response;
});

console.error("relay listening on :8080");
