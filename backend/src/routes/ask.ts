import { ThinkingLevel } from "@google/genai";
import { Hono } from "hono";
import { z } from "zod";
import { generateGemini } from "../lib/gemini";
import { getLanguage } from "../lib/languages";
import { AnswerSchema } from "../lib/lessonSchema";
import { askSystemPrompt, askUserPrompt } from "../lib/prompts";

const AskRequest = z.object({
	topic: z.string().trim().min(1).max(120),
	language: z.string(),
	question: z.string().trim().min(1).max(500),
	currentNarration: z.string().max(1000).optional(),
	lessonFinished: z.boolean().optional(),
});

export const ask = new Hono<{ Bindings: Env }>();

// POST /api/ask
ask.post("/", async (c) => {
	const parsed = AskRequest.safeParse(await c.req.json().catch(() => null));
	if (!parsed.success) {
		return c.json(
			{
				error: "Send { topic, language, question}",
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
		const text = await generateGemini(c.env, {
			system: askSystemPrompt(lang),
			user: askUserPrompt(parsed.data),
			json: true,
			temperature: 0.6,
			thinking: ThinkingLevel.MINIMAL,
		});
		const answer = AnswerSchema.safeParse(JSON.parse(text));
		if (!answer.success) throw new Error(z.prettifyError(answer.error));
		return c.json(answer.data);
	} catch (err) {
		console.log(err);
		return c.json(
			{ error: "The tutor couldn't answer that right now. Try again." },
			502,
		);
	}
});
