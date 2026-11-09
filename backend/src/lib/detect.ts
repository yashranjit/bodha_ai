import { ThinkingLevel } from "@google/genai";
import { generateGemini } from "./gemini";
import { getLanguage, LANGUAGES } from "./languages";

// Check Unicode ranges to identify languages written in their native scripts.
// This is faster than calling Gemini for every language detection request.
const SCRIPTS: [RegExp, string][] = [
	[/[\u0C00-\u0C7F]/, "te-IN"], // Telugu
	[/[\u0900-\u097F]/, "hi-IN"], // Hindi
	[/[\u0B80-\u0BFF]/, "ta-IN"], // Tamil
	[/[\u0C80-\u0CFF]/, "kn-IN"], // Kannada
];

export async function detectLanguage(env: Env, text: string): Promise<string> {
	try {
		const list = LANGUAGES.map((l) => `${l.code} = ${l.name}`).join(", ");
		const answer = await generateGemini(env, {
			system: `Identify which language the user actually SPOKE or typed.
- Indian languages are often typed in English letters: "arrays nerpinchu" is Telugu, "stack samjhao" is Hindi.
- Speech recognition sometimes writes ENGLISH sentences in Indian script: "ప్లీజ్ టీచ్ మీ అరేస్" is "please teach me arrays" → English. Judge by the WORDS, not the script.
- Plain English like "teach me recursion" is English.
Reply with ONLY one code from: ${list}`,
			user: text,
			temperature: 0,
			thinking: ThinkingLevel.MINIMAL,
		});
		const code = answer.trim();
		if (getLanguage(code)) return code;
	} catch {
		// fall through to the script check below
	}
	// Gemini failed? Fall back to the script — right most of the time
	for (const [script, code] of SCRIPTS) if (script.test(text)) return code;
	return "en-IN";
}
