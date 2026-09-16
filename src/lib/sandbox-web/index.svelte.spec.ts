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
	it('renders a tab per non-empty pane', async () => {
		render(WebSandbox, { code });

		await expect.element(page.getByRole('tab', { name: 'HTML' })).toBeInTheDocument();
		await expect.element(page.getByRole('tab', { name: 'CSS' })).toBeInTheDocument();
		await expect.element(page.getByRole('tab', { name: 'JS' })).not.toBeInTheDocument();
	});

	it('renders the preview iframe', async () => {
		render(WebSandbox, { code });

		await expect.element(page.getByTitle('Web preview')).toBeInTheDocument();
	});

	it('hides the editor when disabled', async () => {
		render(WebSandbox, { code, editor: { enable: false } });

		await expect.element(page.getByTitle('Web preview')).toBeInTheDocument();
		await expect.element(page.getByRole('tab', { name: 'HTML' })).not.toBeInTheDocument();
	});

	it('hides the preview when disabled', async () => {
		render(WebSandbox, { code, preview: { enable: false } });

		await expect.element(page.getByTitle('Web preview')).not.toBeInTheDocument();
		await expect.element(page.getByRole('tab', { name: 'HTML' })).toBeInTheDocument();
	});
});
