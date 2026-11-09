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
	// First, check whether the text contains characters from a native script.
	// If we find one, we already know the language and don't need AI.
	for (const [script, code] of SCRIPTS) {
		if (script.test(text)) return code;
	}

	try {
		// Create a list of supported languages for Gemini to choose from.
		const list = LANGUAGES.map(
			(language) => `${language.code} = ${language.name}`,
		).join(", ");

		// Some students type Indian languages using English letters.
		// For example, "arrays nerpinchu" is Telugu written in English letters.
		// Gemini helps us identify these cases.
		const answer = await generateGemini(env, {
			system: `Identify the language the user is speaking. Indian languages are often typed in English letters: "arrays nerpinchu" is Telugu, "stack samjhao" is Hindi, "sollunga" is Tamil. Plain English like "teach me recursion" is English.
Reply with ONLY one code from: ${list}`,
			user: text,
			temperature: 0,
			thinking: ThinkingLevel.MINIMAL,
		});

		// Remove extra spaces and check whether Gemini returned a supported code.
		const code = answer.trim();

		// If the returned code isn't in our language list, use English as fallback.
		return getLanguage(code) ? code : "en-IN";
	} catch {
		// If Gemini fails for any reason, default to English.
		return "en-IN";
	}
}
