import { compile } from 'svelte/compiler';

export interface CompiledResult {
	js: Record<string, string>;
	errors: Record<string, string>;
}

/**
 * Compile sandbox files on the host using the project's own Svelte version.
 * - `.svelte` files are compiled to client JS with injected CSS
 * - `.js` / `.ts` files are passed through untouched
 * - failures are collected per-file so one broken file doesn't kill the preview
 */
export function compileFiles(files: Record<string, string>): CompiledResult {
	const js: Record<string, string> = {};
	const errors: Record<string, string> = {};

	for (const [name, source] of Object.entries(files)) {
		try {
			if (name.endsWith('.js') || name.endsWith('.ts')) {
				js[name] = source;
				continue;
			}
			const result = compile(source, {
				filename: name,
				generate: 'client',
				css: 'injected',
				dev: false
			});
			js[name] = result.js.code;
		} catch (err) {
			errors[name] = err instanceof Error ? err.message : String(err);
		}
	}

	return { js, errors };
}
