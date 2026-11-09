import { ApiError, GoogleGenAI, ThinkingLevel } from "@google/genai";

interface Prompt {
	system: string;
	user: string;
	json?: boolean;
	temperature?: number;
	thinking?: ThinkingLevel;
	timeoutMs?: number;
}

const aiErrors = [429, 500, 503];

const TIMEOUT = 30000;

class InvalidJsonError extends Error {
	name = "InvalidJsonError";
}

function isRetryable(error: unknown): boolean {
	if (error instanceof ApiError) return aiErrors.includes(error.status);
	return (
		error instanceof Error &&
		["TimeoutError", "AbortError", "InvalidJsonError"].includes(error.name)
	);
}

export async function generateGemini(
	env: Env,
	prompt: Prompt,
): Promise<string> {
	const ai = new GoogleGenAI({
		apiKey: env.GEMINI_API_KEY,
	});

	const models = [env.GEMINI_MODEL, env.GEMINI_FALLBACK_MODEL];

	for (const model of models) {
		try {
			console.log(`Trying model: ${model}`);

			const response = await ai.models.generateContent({
				model: model,
				contents: prompt.user,
				config: {
					systemInstruction: prompt.system,
					temperature: prompt.temperature ?? 0.7,
					responseMimeType: prompt.json ? "application/json" : "text/plain",
					thinkingConfig: {
						thinkingLevel: prompt.thinking ?? ThinkingLevel.LOW,
					},
					abortSignal: AbortSignal.timeout(prompt.timeoutMs ?? TIMEOUT),
				},
			});

			const text = response.text ?? "";

			// Check if response is valid JSON
			if (prompt.json) {
				try {
					JSON.parse(text);
				} catch {
					throw new InvalidJsonError(`${model} returned invalid JSON`);
				}
			}

			return text;
		} catch (error) {
			console.log(`Model ${model} failed:`, error);

			// Check whether we can try another model
			if (isRetryable(error)) {
				console.log("Trying fallback model...");
				continue;
			}

			throw error;
		}
	}

	throw new Error("All Gemini models failed");
}

const FIRST_CHUNK_TIMEOUT = 10000;

export async function* streamGemini(
	env: Env,
	prompt: Prompt,
): AsyncGenerator<string> {
	const ai = new GoogleGenAI({
		apiKey: env.GEMINI_API_KEY,
	});

	const models = [env.GEMINI_MODEL, env.GEMINI_FALLBACK_MODEL];

	for (const model of models) {
		const controller = new AbortController();

		let firstChunkReceived = false;

		const timer = setTimeout(() => {
			controller.abort();
		}, FIRST_CHUNK_TIMEOUT);

		try {
			console.log(`Streaming from: ${model}`);

			const stream = await ai.models.generateContentStream({
				model: model,
				contents: prompt.user,
				config: {
					systemInstruction: prompt.system,
					temperature: prompt.temperature ?? 0.7,
					thinkingConfig: {
						thinkingLevel: prompt.thinking ?? ThinkingLevel.LOW,
					},
					abortSignal: controller.signal,
				},
			});

			for await (const chunk of stream) {
				if (!firstChunkReceived) {
					firstChunkReceived = true;
					clearTimeout(timer);
					console.log("First chunk received");
				}

				if (chunk.text) {
					yield chunk.text;
				}
			}

			return;
		} catch (error) {
			console.log(`Streaming failed for ${model}:`, error);

			if (!firstChunkReceived && isRetryable(error)) {
				continue;
			}

			throw error;
		} finally {
			clearTimeout(timer);
		}
	}

	throw new Error("All streaming models failed");
}
