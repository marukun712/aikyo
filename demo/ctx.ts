const port = Number(Deno.args[0] ?? "9001");
const reader = Deno.stdin.readable.getReader();
const decoder = new TextDecoder();

while (true) {
	await Deno.stdout.write(new TextEncoder().encode("input: "));

	const { value, done } = await reader.read();
	if (done) break;

	const context = decoder.decode(value).trim();
	if (!context) continue;

	const res = await fetch(`http://localhost:${port}/context`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ context }),
	});

	if (!res.ok) console.error("failed:", res.status);
}
