import type { NetworkMessage, Transport } from "../types.ts";

// 低レベルのWebSocketラッパー。JSONのシリアライズと接続ライフサイクルのみ担当。
// 会話ロジックはここに持ち込まない。
export class WebSocketTransport implements Transport {
	private ws: WebSocket;
	private handlers: ((message: NetworkMessage) => void)[] = [];

	constructor(ws: WebSocket) {
		this.ws = ws;
		ws.addEventListener("message", (e) => {
			const message = JSON.parse(e.data) as NetworkMessage;
			for (const h of this.handlers) h(message);
		});
	}

	waitForOpen(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (this.ws.readyState === WebSocket.OPEN) {
				resolve();
				return;
			}
			this.ws.addEventListener("open", () => resolve(), { once: true });
			this.ws.addEventListener(
				"error",
				() => reject(new Error("websocket connection failed")),
				{ once: true },
			);
		});
	}

	send(message: NetworkMessage): void {
		if (this.ws.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(message));
		}
	}

	onReceive(handler: (message: NetworkMessage) => void): void {
		this.handlers.push(handler);
	}
}
