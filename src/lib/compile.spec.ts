import { describe, expect, it } from 'vitest';
import { compileFiles } from './compile.js';

describe('compileFiles', () => {
	it('compiles a valid .svelte file to client JS', () => {
		const { js, errors } = compileFiles({ 'App.svelte': '<h1>Hello</h1>' });

		expect(errors).toEqual({});
		expect(Object.keys(js)).toEqual(['App.svelte']);
		expect(js['App.svelte']).toContain('Hello');
	});

	it('passes .js and .ts files through untouched', () => {
		const source = 'export const a = 1;';
		const { js, errors } = compileFiles({ 'util.js': source, 'other.ts': source });

		expect(errors).toEqual({});
		expect(js['util.js']).toBe(source);
		expect(js['other.ts']).toBe(source);
	});

	it('collects errors per file without throwing', () => {
		const { js, errors } = compileFiles({
			'App.svelte': '<h1>Hello</h1>',
			'Broken.svelte': '<h1>{#if}</h1>'
		});

		expect(js['App.svelte']).toContain('Hello');
		expect(js['Broken.svelte']).toBeUndefined();
		expect(Object.keys(errors)).toEqual(['Broken.svelte']);
		expect(errors['Broken.svelte']).toEqual(expect.any(String));
	});
});
