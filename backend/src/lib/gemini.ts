const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

interface Prompt {
	system: string;
	user: string;
	json?: boolean;
	temperature?: number;
}

export async function generateGemini(env: Env, p: Prompt): Promise<string> {
	const res = await fetch(`${BASE}/${env.GEMINI_MODEL}:generateContent`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"x-goog-api-key": env.GEMINI_API_KEY,
		},
		body: JSON.stringify({
			systemInstruction: { parts: [{ text: p.system }] },
			contents: [{ role: "user", parts: [{ text: p.user }] }],
			generationConfig: {
				temperature: p.temperature ?? 0.7,
				responseMimeType: p.json ? "application/json" : "text/plain",
				thinkingConfig: { thinkingBudget: 0 },
			},
		}),
	});
	if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
	const data: any = await res.json();
	return (
		data.candidates?.[0]?.content?.parts
			?.map((x: any) => x.text ?? "")
			.join("") ?? ""
	);
}
