export class LineSplitter {
	private buffer = '';

	push(chunk: string): string[] {
		this.buffer += chunk;
		const lines = this.buffer.split('\n');
		this.buffer = lines.pop() ?? '';
		return lines.map(clean).filter(Boolean);
	}

	flush(): string[] {
		const rest = clean(this.buffer);
		this.buffer = '';
		return rest ? [rest] : [];
	}
}

function clean(line: string) {
	const t = line.trim();
	return t.startsWith('```') ? '' : t;
}
