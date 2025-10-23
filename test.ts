const ws = new WebSocket("ws://localhost:8080");

ws.onopen = () => {
  for (let i = 0; i < 3; i++) {
    ws.send(
      JSON.stringify({
        topic: "messages",
        body: {
          jsonrpc: "2.0",
          method: "message.send",
          params: {
            id: crypto.randomUUID(),
            from: "user_maril",
            to: ["companion_kyoko", "companion_aya", "companion_natsumi"],
            message: "みんなで話して",
          },
        },
      }),
    );
  }
};
