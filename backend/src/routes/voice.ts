import { Hono } from "hono";
import { z } from "zod";
import { GnaniError, synthesize } from "../lib/gnani";
import { getLanguage } from "../lib/languages";
import { toSpeakable } from "../lib/speakable";

export const voice = new Hono<{ Bindings: Env }>();

const TtsRequest = z.object({
	text: z.string().trim().min(1).max(800),
	language: z.string(),
});

// POST /api/tts {text, language} -> audio/wav

voice.post("/tts", async (c) => {
	const parsed = TtsRequest.safeParse(await c.req.json().catch(() => null));
	if (!parsed.success) {
		return c.json(
			{
				error: "Send { text, langugae }",
				details: z.prettifyError(parsed.error),
			},
			400,
		);
	}

	const lang = getLanguage(parsed.data.language);
	if (!lang)
		return c.json(
			{ error: `Unsupported language: ${parsed.data.language}` },
			400,
		);

	try {
		const audio = await synthesize(c.env, {
			text: toSpeakable(parsed.data.text),
			language: lang.code,
			voice: lang.voice,
		});

		// we pipe the gnani stram directly to the browser
		return new Response(audio.body, {
			headers: {
				"Content-Type": "audio/wav",
				"Cache-Control": "public, max-age=86400",
			},
		});
	} catch (err) {
		console.log(err);
		const status = err instanceof GnaniError && err.status === 429 ? 429 : 502;
		return c.json(
			{ error: "The tutor's voice is unvailable right now." },
			status,
		);
	}
});
