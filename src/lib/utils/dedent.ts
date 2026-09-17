export function dedent(str: string): string {
	const lines = str.split('\n');
	if (lines.at(0)?.trim() === '') lines.shift();
	if (lines.at(-1)?.trim() === '') lines.pop();
	const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^\s*/)![0].length));
	return lines.map((l) => l.slice(indent)).join('\n');
}

export function dedentCode(code?: { html?: string; css?: string; script?: string }) {
	return {
		html: dedent(code?.html ?? ''),
		css: dedent(code?.css ?? ''),
		script: dedent(code?.script ?? '')
	};
}
