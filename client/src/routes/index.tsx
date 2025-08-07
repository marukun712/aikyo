import { createSignal, For } from "solid-js";

export default function Home() {
  const [sessionId, setSessionId] = createSignal<string | null>(null);
  const [isConnected, setIsConnected] = createSignal(false);
  const [perceptionType, setPerceptionType] = createSignal<"text" | "vision">(
    "text"
  );
  const [textInput, setTextInput] = createSignal("");
  const [fileInput, setFileInput] = createSignal<File | null>(null);
  const [isLoading, setIsLoading] = createSignal(false);
  const [actions, setActions] = createSignal<string[]>([]);

  async function init() {
    setIsLoading(true);
    const data = {
      jsonrpc: "2.0",
      method: "agent.init",
    };
    const res = await fetch("http://localhost:3001/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error("初期化に失敗しました。");
    }
    const json = await res.json();
    const sessionId = json.result.sessionId;
    setSessionId(sessionId);
    connectToWebSocket(sessionId);
    setIsLoading(false);
  }

  async function connectToWebSocket(sessionId: string) {
    const ws = new WebSocket("http://localhost:3001/");

    ws.onopen = (event) => {
      ws.send(
        JSON.stringify({
          jsonrpc: "2.0",
          method: "subscribe.request",
          params: {
            sessionId,
          },
        })
      );
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      setActions((prev) => [...prev, event.data]);
    };
  }

  async function sendPerception() {
    if (!isConnected() || isLoading() || !sessionId()) {
      throw new Error("先に初期化を完了してください。");
    }

    switch (perceptionType()) {
      case "text": {
        const text = textInput();
        if (!text) {
          throw new Error("入力されていません！");
        }

        const data = {
          jsonrpc: "2.0",
          method: "perception.send",
          params: {
            title: "input",
            format: "text",
            body: text,
          },
        };
        await fetch("http://localhost:3001/perception/" + sessionId(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        break;
      }
      case "vision": {
        const file = fileInput();
        if (!file) {
          throw new Error("入力されていません！");
        }
        const base64 = await fileToBase64(file);
        const data = {
          jsonrpc: "2.0",
          method: "perception.send",
          params: {
            title: "vision",
            format: "image",
            body: base64,
          },
        };
        await fetch("http://localhost:3001/perception/" + sessionId(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        break;
      }
    }
  }

  async function onSubmit(e: SubmitEvent) {
    e.preventDefault();
    sendPerception();
  }

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          resolve(result.split(",")[1]);
        } else {
          reject("ファイルの読み込みに失敗しました。");
        }
      };
      reader.onerror = () => reject("ファイルの読み込みに失敗しました。");
      reader.readAsDataURL(file);
    });

  return (
    <main class="max-w-2xl mx-auto text-gray-800 p-6 space-y-6">
      <h1 class="text-3xl font-bold text-center">
        AI Companion Protocol Test Client
      </h1>

      <div class="bg-white shadow-md rounded-2xl p-6 space-y-4">
        <button
          onClick={() => init()}
          disabled={isLoading() || !!sessionId()}
          class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-xl transition duration-200"
        >
          {isLoading()
            ? "初期化中..."
            : sessionId()
            ? "初期化済み"
            : "Agentを初期化"}
        </button>

        <div class="flex items-center gap-2">
          <div
            class={`w-3 h-3 rounded-full ${
              isConnected() ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          <span class="text-sm text-gray-600">
            {isConnected() ? "WebSocket接続中" : "WebSocket未接続"}
          </span>
        </div>

        <h2 class="text-lg text-gray-600">
          Session ID:{" "}
          <span class="font-mono text-sm">{sessionId() || "未初期化"}</span>
        </h2>
      </div>

      <div class="bg-white shadow-md rounded-2xl p-6 space-y-4">
        <h2 class="text-xl font-semibold text-gray-700">知覚情報を入力</h2>
        <form class="space-y-4" onSubmit={(e) => onSubmit(e)}>
          <select
            class="w-full p-2 border rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={perceptionType()}
            onInput={(e) =>
              setPerceptionType(e.currentTarget.value as "text" | "vision")
            }
          >
            <option value="text">テキスト</option>
            <option value="vision">画像</option>
          </select>

          {perceptionType() === "text" ? (
            <textarea
              rows={5}
              placeholder="知覚テキストを入力してください"
              class="w-full p-3 border rounded-lg shadow-inner resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={textInput()}
              onInput={(e) => setTextInput(e.currentTarget.value)}
            />
          ) : (
            <input
              type="file"
              accept="image/*"
              class="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              onChange={(e) => {
                const file = e.currentTarget.files?.[0];
                setFileInput(file || null);
              }}
            />
          )}

          <button
            type="submit"
            disabled={isLoading() || !sessionId()}
            class="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-xl transition duration-200"
          >
            {isLoading() ? "送信中..." : "Submit"}
          </button>
        </form>
      </div>

      <div class="bg-white shadow-md rounded-2xl p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-gray-700">アクション履歴</h2>
          <button
            onClick={() => setActions([])}
            class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm transition duration-200"
          >
            クリア
          </button>
        </div>

        <div class="space-y-3 max-h-64 overflow-y-auto">
          {actions().length <= 0 ? (
            <p class="text-gray-500 italic">アクションはまだありません</p>
          ) : (
            <For each={actions()}>
              {(action) => {
                return (
                  <pre
                    class={
                      "mt-2 p-2 overflow-x-auto whitespace-pre-wrap break-words"
                    }
                  >
                    <code class={"text-blue-600 text-xl"}>
                      {JSON.stringify(JSON.parse(action), undefined, 2)}
                    </code>
                  </pre>
                );
              }}
            </For>
          )}
        </div>
      </div>
    </main>
  );
}
