import { createHash } from "node:crypto";

export function computeRootHash(entries: string[]): string {
	return createHash("sha256").update(entries.join("\n")).digest("hex");
}

export function electLeader(tid: string, nodeIds: string[]): string {
	const hash = (input: string) =>
		createHash("sha256").update(input).digest("hex");
	let leader = nodeIds[0];
	for (const nodeId of nodeIds) {
		if (hash(tid + nodeId) < hash(tid + leader)) {
			leader = nodeId;
		}
	}
	return leader;
}
