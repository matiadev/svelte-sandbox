import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import WebSandbox from './index.svelte';

const code = {
	html: '<h1>Hello</h1>',
	css: 'h1 { color: red; }',
	script: ''
};

describe('WebSandbox.svelte', () => {
	it('renders a tab per pane, even when empty', async () => {
		render(WebSandbox, { code });

		await expect.element(page.getByRole('tab', { name: 'HTML' })).toBeInTheDocument();
		await expect.element(page.getByRole('tab', { name: 'CSS' })).toBeInTheDocument();
		await expect.element(page.getByRole('tab', { name: 'JS' })).toBeInTheDocument();
	});

	it('renders the preview iframe', async () => {
		render(WebSandbox, { code });

		await expect.element(page.getByTitle('Web preview')).toBeInTheDocument();
	});

	it('hides the editor in previewOnly mode', async () => {
		render(WebSandbox, { code, previewOnly: true });

		await expect.element(page.getByTitle('Web preview')).toBeInTheDocument();
		await expect.element(page.getByRole('tab', { name: 'HTML' })).not.toBeInTheDocument();
	});
});
