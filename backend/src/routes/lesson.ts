import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { z } from 'zod';
import { streamGemini } from '../lib/gemini';
import { getLanguage } from '../lib/languages';
import { MetaSchema, SceneSchema } from '../lib/lessonSchema';
import { lessonSystemPrompt } from '../lib/prompts';
import { LineSplitter } from '../lib/streamUtils';

const LessonRequest = z.object({
	topic: z.string().trim().min(2).max(120),
	language: z.string().optional(),
});

export const lesson = new Hono<{ Bindings: Env }>();

//POST /api/lesson → text/event-stream
lesson.post('/', async (c) => {
	const parsed = LessonRequest.safeParse(await c.req.json().catch(() => null));
	if (!parsed.success) {
		console.log(z.prettifyError(parsed.error));
		return c.json(
			{
				error: 'Send {topic, language?}',
				details: z.prettifyError(parsed.error),
			},
			400,
		);
	}

	const { topic, language } = parsed.data;
	const lang = language ? getLanguage(language) : undefined;
	if (language && !lang)
		return c.json({ error: `Unsupported language: ${language}` }, 400);

	return streamSSE(c, async (stream) => {
		const splitter = new LineSplitter();
		let sentMeta = false;
		let count = 0;

		const handleLine = async (line: string) => {
			let raw: unknown;
			try {
				raw = JSON.parse(line);
			} catch {
				console.log('skipping malformed line:', line.slice(0.8));
				return;
			}
			if (!sentMeta) {
				sentMeta = true;
				const meta = MetaSchema.safeParse(raw);
				const detected =
					meta.success && getLanguage(meta.data.language)
						? meta.data.language
						: undefined;
				await stream.writeSSE({
					event: 'meta',
					data: JSON.stringify({
						language: detected ?? lang?.code ?? 'en-IN',
						title: meta.success ? meta.data.title : topic,
					}),
				});
				if (meta.success) return;
			}

			const scene = SceneSchema.safeParse(raw);
			if (!scene.success) {
				console.log('skipping invalid scene', scene.error.issues[0]?.message);
				return;
			}
			count++;
			await stream.writeSSE({
				event: 'scene',
				data: JSON.stringify({ id: count, ...scene.data }),
			});
		};

		try {
			const chunks = streamGemini(c.env, {
				system: lessonSystemPrompt(lang),
				user: `Teach me: ${topic}`,
			});
			for await (const chunk of chunks) {
				for (const line of splitter.push(chunk)) await handleLine(line);
			}

			for (const line of splitter.flush()) await handleLine(line);
			if (count === 0) throw new Error('No valid scenes produced');
			await stream.writeSSE({
				event: 'done',
				data: JSON.stringify({ count }),
			});
		} catch (err) {
			console.log(err);
			await stream.writeSSE({
				event: 'error',
				data: JSON.stringify({
					message: "The tutor couldn't prepare this lesson. Try again.",
				}),
			});
		}
	});
});
