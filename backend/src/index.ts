import { Hono } from 'hono';
import { z } from 'zod';
import { generateGemini } from './lib/gemini';
import { getLanguage, LANGUAGES } from './lib/languages';
import { lessonSystemPrompt } from './lib/prompts';

const app = new Hono<{ Bindings: Env }>();

app.get('/api/health', (c) => c.json({ ok: true }));

app.get('/api/languages', (c) =>
	c.json(
		LANGUAGES.map(({ code, name, nativeName }) => ({ code, name, nativeName })),
	),
);

const LessonRequest = z.object({
	topic: z.string().trim().min(2).max(120),
	language: z.string().optional(),
});

app.post('/api/lesson', async (c) => {
	const parsed = LessonRequest.safeParse(await c.req.json().catch(() => null));
	if (!parsed.success)
		return c.json({ error: 'Send { topic, language?}' }, 400);

	const { topic, language } = parsed.data;
	const lang = language ? getLanguage(language) : undefined;
	if (language && !lang)
		return c.json({ error: `Unsupported language: ${language}` }, 400);

	try {
		const text = await generateGemini(c.env, {
			system: lessonSystemPrompt(lang),
			user: `Teach me: ${topic}`,
			json: true,
		});
		const lesson = JSON.parse(text);
		if (!getLanguage(lesson.language)) lesson.language = 'en-IN';
		return c.json(lesson);
	} catch (err) {
		console.error(err);
		return c.json(
			{ error: "The tutor couldn't prepare this lesson. Try again" },
			502,
		);
	}
});
export default app;
