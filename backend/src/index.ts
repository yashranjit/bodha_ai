import { Hono } from "hono";
import { LANGUAGES } from "./lib/languages";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/health", (c) => c.json({ ok: true }));

app.get("/api/languages", (c) =>
	c.json(
		LANGUAGES.map(({ code, name, nativeName }) => ({ code, name, nativeName })),
	),
);

// temporary check
app.get("/api/env-check", (c) =>
	c.json({
		gemini: Boolean(c.env.GEMINI_API_KEY),
		gnani: Boolean(c.env.GNANI_API_KEY),
		model: c.env.GEMINI_MODEL,
	}),
);
export default app;
