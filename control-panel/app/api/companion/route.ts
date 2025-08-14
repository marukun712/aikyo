import { spawn } from "child_process";
export const fetchCache = "default-no-store";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const companionId = url.searchParams.get("COMPANION_ID");
  if (!companionId) {
    return new Response("Missing COMPANION_ID", { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const proc = spawn(
        "docker-compose",
        ["-p", companionId, "up", "--build"],
        {
          cwd: process.cwd(),
          env: { ...process.env, COMPANION_ID: companionId },
        }
      );

      const send = (line: string) => {
        controller.enqueue(encoder.encode(`data: ${line}\n\n`));
      };

      proc.stdout.on("data", (chunk) => send(chunk.toString()));
      proc.stderr.on("data", (chunk) => send(`${chunk.toString()}`));
      proc.on("exit", (code) => {
        send(`--- docker-compose exited with code ${code} ---`);
        controller.close();
      });
      proc.on("error", (err) => {
        send(`[PROCESS ERROR] ${err.message}`);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export async function DELETE(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }
  const companionId = body?.COMPANION_ID;
  if (!companionId) {
    return new Response("Missing COMPANION_ID in body", { status: 400 });
  }

  try {
    await new Promise<void>((resolve, reject) => {
      const proc = spawn("docker-compose", ["-p", companionId, "down"], {
        cwd: process.cwd(),
        env: { ...process.env },
      });

      proc.on("exit", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`docker-compose down exited with code ${code}`));
      });
      proc.on("error", (err) => reject(err));
    });
    return new Response("Stopped project: " + companionId, { status: 200 });
  } catch (err: any) {
    return new Response("Error stopping: " + err.message, { status: 500 });
  }
}
