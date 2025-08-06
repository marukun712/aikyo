import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

interface PerceptionData {
  title: string;
  format: "object" | "text" | "image";
  body: string;
}

interface JSONRPCRequest {
  jsonrpc: "2.0";
  method: string;
  params: PerceptionData;
  id?: string | number;
}

const SERVER_URL = "http://localhost:3000";

async function sendPerception(data: PerceptionData): Promise<void> {
  const request: JSONRPCRequest = {
    jsonrpc: "2.0",
    method: "perception",
    params: data,
  };

  try {
    const response = await fetch(`${SERVER_URL}/perception`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("エラーが発生しました。", error);
    } else {
      console.log("エラーが発生しました。");
    }
  } catch (error) {
    console.error("エラーが発生しました。", error);
  }
}

app.post("/vision", async (c) => {
  const body = await c.req.json();

  const perceptionData: PerceptionData = {
    title: "vision",
    format: body.format || "image",
    body: body.data || body.body,
  };

  await sendPerception(perceptionData);

  return c.json({ success: true, message: "Vision data sent to LLM" });
});

app.post("/input", async (c) => {
  const body = await c.req.json();

  const perceptionData: PerceptionData = {
    title: "input",
    format: "text",
    body: body.message || body.text || body.body,
  };

  await sendPerception(perceptionData);

  return c.json({ success: true, message: "Input data sent to LLM" });
});

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/", (c) => {
  const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Companion Client</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        .section {
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
        }
        .section h2 {
            margin-top: 0;
            color: #555;
        }
        input[type="text"], textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 4px;
            margin-bottom: 10px;
            box-sizing: border-box;
        }
        input[type="file"] {
            margin-bottom: 10px;
        }
        button {
            background: #007bff;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 10px;
        }
        button:hover {
            background: #0056b3;
        }
        .status {
            margin-top: 10px;
            padding: 10px;
            border-radius: 4px;
            display: none;
        }
        .success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        #imagePreview {
            max-width: 100%;
            max-height: 200px;
            margin-top: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>AI Companion Protocol Client</h1>
        
        <div class="section">
            <h2>📷 Vision Input</h2>
            <input type="file" id="imageFile" accept="image/*">
            <img id="imagePreview" style="display: none;">
            <br>
            <button onclick="sendVision()">Send Vision Data</button>
            <div id="visionStatus" class="status"></div>
        </div>
        
        <div class="section">
            <h2>💬 Text Input</h2>
            <textarea id="textInput" rows="4" placeholder="メッセージを入力してください..."></textarea>
            <button onclick="sendInput()">Send Text Input</button>
            <div id="inputStatus" class="status"></div>
        </div>
        
        <div class="section">
            <h2>📊 Status</h2>
            <button onclick="checkHealth()">Check Server Health</button>
            <div id="healthStatus" class="status"></div>
        </div>
    </div>

    <script>
        document.getElementById('imageFile').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.getElementById('imagePreview');
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });

        async function sendVision() {
            const fileInput = document.getElementById('imageFile');
            const statusDiv = document.getElementById('visionStatus');
            
            if (!fileInput.files[0]) {
                showStatus(statusDiv, 'error', '画像を選択してください');
                return;
            }

            const file = fileInput.files[0];
            const reader = new FileReader();
            
            reader.onload = async function(e) {
                try {
                    const base64Data = e.target.result.split(',')[1];
                    const response = await fetch('/vision', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            format: 'image',
                            data: base64Data
                        })
                    });

                    const result = await response.json();
                    if (response.ok) {
                        showStatus(statusDiv, 'success', result.message);
                    } else {
                        showStatus(statusDiv, 'error', result.message || 'エラーが発生しました');
                    }
                } catch (error) {
                    showStatus(statusDiv, 'error', 'ネットワークエラー: ' + error.message);
                }
            };
            
            reader.readAsDataURL(file);
        }

        async function sendInput() {
            const textInput = document.getElementById('textInput');
            const statusDiv = document.getElementById('inputStatus');
            const message = textInput.value.trim();
            
            if (!message) {
                showStatus(statusDiv, 'error', 'テキストを入力してください');
                return;
            }

            try {
                const response = await fetch('/input', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: message
                    })
                });

                const result = await response.json();
                if (response.ok) {
                    showStatus(statusDiv, 'success', result.message);
                    textInput.value = '';
                } else {
                    showStatus(statusDiv, 'error', result.message || 'エラーが発生しました');
                }
            } catch (error) {
                showStatus(statusDiv, 'error', 'ネットワークエラー: ' + error.message);
            }
        }

        async function checkHealth() {
            const statusDiv = document.getElementById('healthStatus');
            
            try {
                const response = await fetch('/health');
                const result = await response.json();
                
                if (response.ok) {
                    showStatus(statusDiv, 'success', \`サーバー正常 - \${result.timestamp}\`);
                } else {
                    showStatus(statusDiv, 'error', 'サーバーエラー');
                }
            } catch (error) {
                showStatus(statusDiv, 'error', 'サーバーに接続できません: ' + error.message);
            }
        }

        function showStatus(element, type, message) {
            element.className = \`status \${type}\`;
            element.textContent = message;
            element.style.display = 'block';
            
            setTimeout(() => {
                element.style.display = 'none';
            }, 5000);
        }

        // ページ読み込み時にヘルスチェック
        window.onload = function() {
            checkHealth();
        };
    </script>
</body>
</html>
  `;
  return c.html(html);
});

const port = 3001;
console.log(`Client server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
