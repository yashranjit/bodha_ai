import { Hono } from 'hono';
import { LANGUAGES } from './lib/languages';
import { lesson } from './routes/lesson';

const app = new Hono<{ Bindings: Env }>();

app.get('/api/health', (c) => c.json({ ok: true }));

app.get('/api/languages', (c) =>
	c.json(
		LANGUAGES.map(({ code, name, nativeName }) => ({ code, name, nativeName })),
	),
);

app.route('/api/lesson', lesson);

export default app;
