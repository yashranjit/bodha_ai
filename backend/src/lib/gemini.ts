import { ApiError, GoogleGenAI, ThinkingLevel } from '@google/genai';

interface Prompt {
	system: string;
	user: string;
	json?: boolean;
	temperature?: number;
}

// 503 -> overloaded, rate-limited - 429, 500 - server error : worth trying another model
const RETRYABLE = [429, 500, 503];

const TIMEOUT_MS = 30_000; // giving each model 30secs before moving on

function isTimeout(err: unknown) {
	return (
		err instanceof Error &&
		(err.name === 'TimeoutError' || err.name === 'AbortError')
	);
}

class BadJsonError extends Error {
	name = 'BadJsonError';
}

export async function generateGemini(env: Env, p: Prompt): Promise<string> {
	const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
	const models = [env.GEMINI_MODEL, env.GEMINI_FALLBACK_MODEL];

	for (const [i, model] of models.entries()) {
		const isLast = i === models.length - 1;
		try {
			console.log(`-> trying ${model}...`);
			const started = Date.now();
			const res = await ai.models.generateContent({
				model,
				contents: p.user,
				config: {
					systemInstruction: p.system,
					temperature: p.temperature ?? 0.7,
					responseMimeType: p.json ? 'application/json' : 'text/plain',
					thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
					abortSignal: AbortSignal.timeout(TIMEOUT_MS),
				},
			});
			console.log(
				`${model} took ${((Date.now() - started) / 1000).toFixed(1)}s`,
			);

			const text = res.text ?? '';
			if (p.json) {
				try {
					JSON.parse(text);
				} catch {
					throw new BadJsonError(`${model} return invalid JSON`);
				}
			}

			return text;
		} catch (err) {
			const retryable =
				isTimeout(err) ||
				err instanceof BadJsonError ||
				(err instanceof ApiError && RETRYABLE.includes(err.status));
			if (retryable && !isLast) {
				console.warn(
					`${model} failed (${(err as Error).name}), trying ${models[i + 1]}`,
				);
				continue;
			}
			throw err;
		}
	}
	throw new Error('unreachable');
}
