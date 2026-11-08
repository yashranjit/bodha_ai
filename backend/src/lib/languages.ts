export interface Language {
	code: string;
	name: string;
	nativeName: string;
	voice: string;
	sample: string;
}

export const LANGUAGES: Language[] = [
	{
		code: 'te-IN',
		name: 'Telugu',
		nativeName: 'తెలుగు',
		voice: 'Nalini',
		sample:
			'ఈ array లో ప్రతి box కి ఒక index ఉంటుంది. Index ఎప్పుడూ zero నుండి start అవుతుంది.',
	},
	{
		code: 'hi-IN',
		name: 'Hindi',
		nativeName: 'हिन्दी',
		voice: 'Nalini',
		sample:
			'इस array में हर box का एक index होता है। Index हमेशा zero से start होता है।',
	},
	{
		code: 'ta-IN',
		name: 'Tamil',
		nativeName: 'தமிழ்',
		voice: 'Nalini',
		sample:
			'இந்த array-ல ஒவ்வொரு box-க்கும் ஒரு index இருக்கு. Index எப்பவுமே zero-ல இருந்து start ஆகும்.',
	},
	{
		code: 'kn-IN',
		name: 'Kannada',
		nativeName: 'ಕನ್ನಡ',
		voice: 'Nalini',
		sample:
			'ಈ array ನಲ್ಲಿ ಪ್ರತಿ box ಗೆ ಒಂದು index ಇರುತ್ತೆ. Index ಯಾವಾಗಲೂ zero ಇಂದ start ಆಗುತ್ತೆ.',
	},
	{
		code: 'en-IN',
		name: 'English (Indian)',
		nativeName: 'English',
		voice: 'Nalini',
		sample:
			'Every box in this array has an index. The index always starts from zero.',
	},
];
export function getLanguage(code: string) {
	return LANGUAGES.find((l) => l.code === code);
}
