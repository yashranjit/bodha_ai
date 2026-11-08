import { Hono } from 'hono';
import { z } from 'zod';
import { GnaniError, synthesize, transcribe } from '../lib/gnani';
import { getLanguage } from '../lib/languages';
import { toSpeakable } from '../lib/speakable';

export const voice = new Hono<{ Bindings: Env }>();

const TtsRequest = z.object({
	text: z.string().trim().min(1).max(800),
	language: z.string(),
});

// POST /api/tts {text, language} -> audio/wav

voice.post('/tts', async (c) => {
	const parsed = TtsRequest.safeParse(await c.req.json().catch(() => null));
	if (!parsed.success) {
		return c.json(
			{
				error: 'Send { text, langugae }',
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
				'Content-Type': 'audio/wav',
				'Cache-Control': 'public, max-age=86400',
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

const MAX_AUDIO_BYTES = 5 * 1024 * 1024;

//POST /api/sst multipart: audio (file), language
voice.post('/stt', async (c) => {
	const form = await c.req.formData().catch(() => null);
	const audio = form?.get('audio');
	const language = String(form?.get('language') ?? 'indic-auto');

	if (!(audio instanceof File))
		return c.json({ error: "Send an 'audio' file" }, 400);
	if (audio.size > MAX_AUDIO_BYTES)
		return c.json({ error: 'keep questions under 30 seconds' }, 413);
	if (language !== 'indic-auto' && !getLanguage(language)) {
		return c.json({ error: `Unsupported language: ${language}` }, 400);
	}

	try {
		const { transcript, detectedLanguage } = await transcribe(c.env, {
			audio,
			language,
		});
		return c.json({
			transcript,
			language:
				detectedLanguage && getLanguage(detectedLanguage)
					? detectedLanguage
					: undefined,
		});
	} catch (err) {
		console.log(err);
		return c.json({ error: "Couldn't hear that clearly. Please try again" });
	}
});
