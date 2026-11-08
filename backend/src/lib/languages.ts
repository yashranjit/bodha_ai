export interface Language {
	code: string;
	name: string;
	nativeName: string;
	voice: string;
}

export const LANGUAGES: Language[] = [
	{ code: "te-IN", name: "Telugu", nativeName: "తెలుగు", voice: "Nalini" },
	{ code: "hi-IN", name: "Hindi", nativeName: "हिन्दी", voice: "Nalini" },
	{ code: "ta-IN", name: "Tamil", nativeName: "தமிழ்", voice: "Nalini" },
	{ code: "kn-IN", name: "Kannada", nativeName: "ಕನ್ನಡ", voice: "Nalini" },
	{
		code: "en-IN",
		name: "English (Indian)",
		nativeName: "English",
		voice: "Nalini",
	},
];

export function getLanguage(code: string) {
	return LANGUAGES.find((l) => l.code === code);
}
