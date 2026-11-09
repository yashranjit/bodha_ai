import { ThinkingLevel } from "@google/genai";
import { generateGemini } from "./gemini";
import { getLanguage, LANGUAGES } from "./languages";

const SCRIPTS: [RegExp, string][] = [
	[/[\u0C00-\u0C7F]/, "te=IN"],
	[/[\u0900-\u097F]/, "hi=IN"],
	[/[\u0B80-\u0BFF]/, "ta=IN"],
	[/[\u0C80-\u0CFF]/, "kn=IN"],
];

export async function detectLanguage(env: Env, text: string): Promise<string> {
	for (const [script, code] of SCRIPTS) if (script.test(text)) return code;

	try {
		const list = LANGUAGES.map((l) => `${l.code} = ${l.name}`).join(", ");
		const answer = await generateGemini(env, {
			system: `Identify the language the user is speaking.Indian languages are often typed in English letters: "arrays nerpinchu" is Telugu, "stack samjhao" is Hindi, "sollunga" is Tamil. Plain English like "teach me recursion" is English.
      Reply with ONLY one code from: ${list}`,
			user: text,
			temperature: 0,
			thinking: ThinkingLevel.MINIMAL,
		});
		const code = answer.trim();
		return getLanguage(code) ? code : "en-IN";
	} catch {
		return "en-IN";
	}
}
