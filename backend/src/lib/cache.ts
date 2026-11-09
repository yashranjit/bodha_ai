export const CACHE_TTL = 60 * 60 * 24 * 30;

export async function sha256(text: string): Promise<string> {
	const buf = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(text),
	);
	return [...new Uint8Array(buf)]
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

export function normalizeTopic(topic: string): string {
	return topic
		.toLowerCase()
		.normalize("NFKC")
		.replace(/[^\p{L}\p{M}\p{N}\s+#]/gu, " ")
		.replace(/\s+/g, " ")
		.trim();
}

export const lessonKey = async (lang: string, topic: string) =>
	`lesson:v1${lang}:${await sha256(normalizeTopic(topic))}`;
