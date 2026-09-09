import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import SvelteSandbox from './SvelteSandbox.svelte';

const files = {
	'App.svelte': '<h1>Hello</h1>',
	'util.js': 'export const a = 1;'
};

describe('SvelteSandbox.svelte', () => {
	it('renders a tab per file', async () => {
		render(SvelteSandbox, { files });

		await expect.element(page.getByRole('button', { name: 'App.svelte' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'util.js' })).toBeInTheDocument();
	});

	it('hides the editor in previewOnly mode', async () => {
		render(SvelteSandbox, { files, previewOnly: true });

		await expect.element(page.getByTitle('sandbox')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'App.svelte' })).not.toBeInTheDocument();
	});
});
