import { Hono } from 'hono';
import { LANGUAGES } from './lib/languages';

const app = new Hono<{ Bindings: Env }>();

app.get('/api/health', (c) => c.json({ ok: true }));

app.get('/api/languages', (c) =>
	c.json(
		LANGUAGES.map(({ code, name, nativeName }) => ({ code, name, nativeName })),
	),
);

export default app;
