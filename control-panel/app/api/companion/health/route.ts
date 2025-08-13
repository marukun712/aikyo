import { spawn } from "child_process";

export async function HEAD(request: Request) {
  const url = new URL(request.url);
  const companionId = url.searchParams.get("COMPANION_ID");
  if (!companionId) {
    return new Response("Missing COMPANION_ID", { status: 400 });
  }

  try {
    const running = await new Promise<boolean>((resolve, reject) => {
      const proc = spawn("docker-compose", ["-p", companionId, "ps", "-q"], {
        cwd: process.cwd(),
        env: { ...process.env },
      });

      let output = "";
      proc.stdout.on("data", (chunk) => (output += chunk.toString()));
      proc.stderr.on("data", (chunk) => (output += chunk.toString()));
      proc.on("exit", (code) => {
        if (code === 0) {
          if (output.trim().length > 0) {
            resolve(output.trim().length > 0);
          } else {
            reject(new Error(output));
          }
        } else {
          reject(new Error(output));
        }
      });
      proc.on("error", (err) => reject(err));
    });

    return new Response(JSON.stringify({ running }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    return new Response("Health check failed: " + err.message, { status: 500 });
  }
}
