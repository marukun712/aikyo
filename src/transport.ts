export interface Transport {
	send(message: Record<string, unknown>): void;
	onReceive(handler: (message: Record<string, unknown>) => void): void;
}

export class WebSocketTransport implements Transport {
	private ws: WebSocket;
	private handlers: ((msg: Record<string, unknown>) => void)[] = [];

	constructor(url: string) {
		this.ws = new WebSocket(url);
		this.ws.onmessage = (e) => {
			const msg = JSON.parse(e.data);
			for (const h of this.handlers) h(msg);
		};
	}

	send(message: Record<string, unknown>): void {
		if (this.ws.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(message));
		}
	}

	onReceive(handler: (message: Record<string, unknown>) => void): void {
		this.handlers.push(handler);
	}

	waitForOpen(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (this.ws.readyState === WebSocket.OPEN) {
				resolve();
				return;
			}
			this.ws.onopen = () => resolve();
			this.ws.onerror = () => reject(new Error("websocket connection failed"));
		});
	}
}
