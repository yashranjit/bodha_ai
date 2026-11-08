export function toSpeakable(text: string): string {
	return text
		.replace(/[`*_#"']/g, '')
		.replace(/[[\]{}()<>]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}
