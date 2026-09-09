import { parse as parseSvelte } from 'svelte/compiler';
import { init, parse as parseImports } from 'es-module-lexer';

let lexerReady = false;
const lexerReadyPromise: Promise<boolean> = init().then(
	() => (lexerReady = true),
	() => false
);

export function ensureLexerReady(): Promise<boolean> {
	return lexerReadyPromise;
}

function isBare(spec: string): boolean {
	return !spec.startsWith('.') && !spec.startsWith('/') && !spec.startsWith('http');
}

function isSvelteSpec(spec: string): boolean {
	return spec === 'svelte' || spec.startsWith('svelte/');
}

function specsFromJs(source: string): string[] {
	if (!lexerReady) return [];
	try {
		const [imports] = parseImports(source);
		const out: string[] = [];
		for (const imp of imports) {
			if (imp.type === 'import-meta') continue;
			if (imp.type === 'dynamic') {
				if (imp.probablyTypeOnly) continue;
				const spec = imp.specifier;
				if (typeof spec === 'string' && spec !== '' && !spec.includes('*')) out.push(spec);
			} else {
				if (imp.typeOnly) continue;
				if (imp.specifier !== '' && !imp.specifier.includes('*')) out.push(imp.specifier);
			}
		}
		return out;
	} catch {
		return [];
	}
}

function svelteScriptChunks(source: string): string[] {
	try {
		const ast = parseSvelte(source, { modern: true }) as unknown as {
			module?: { content?: { start?: number; end?: number } } | null;
			instance?: { content?: { start?: number; end?: number } } | null;
		};
		const chunks: string[] = [];
		for (const script of [ast.module, ast.instance]) {
			const content = script?.content;
			if (
				content &&
				typeof content.start === 'number' &&
				typeof content.end === 'number' &&
				content.end > content.start
			) {
				chunks.push(source.slice(content.start, content.end));
			}
		}
		return chunks;
	} catch {
		return [];
	}
}

/**
 * Collect bare import specifiers across sandbox files with a single reader.
 * `.svelte` scripts are located via the Svelte AST (so markup, comments and
 * string literals can't pollute the importmap) and every script is lexed with
 * es-module-lexer. Svelte itself is excluded, the sandbox pins it separately.
 */
export function collectBareImports(files: Record<string, string>): string[] {
	const specs: string[] = [];
	for (const [name, source] of Object.entries(files)) {
		if (name.endsWith('.svelte')) {
			for (const chunk of svelteScriptChunks(source)) specs.push(...specsFromJs(chunk));
		} else {
			specs.push(...specsFromJs(source));
		}
	}
	return [...new Set(specs)].filter((s) => isBare(s) && !isSvelteSpec(s));
}

/** Bare imports from one plain script. Keeps svelte specs, WebSandbox maps those via esm.sh too. */
export function collectScriptImports(source: string): string[] {
	return [...new Set(specsFromJs(source ?? ''))].filter(isBare);
}
