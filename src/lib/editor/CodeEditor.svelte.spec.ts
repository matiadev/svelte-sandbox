import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import CodeEditor from './CodeEditor.svelte';

describe('CodeEditor.svelte', () => {
	it('keeps focus and accumulates text while typing', async () => {
		const { container } = await render(CodeEditor, { value: '', language: 'javascript' });

		await vi.waitFor(
			() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			},
			{ timeout: 10_000 }
		);

		const content = container.querySelector('.cm-content') as HTMLElement;
		await userEvent.click(content);

		const editor = container.querySelector('.cm-editor') as HTMLElement;
		expect(editor.contains(document.activeElement)).toBe(true);

		for (const key of ['a', 'b', 'c']) {
			await userEvent.keyboard(key);
			expect(container.querySelector('.cm-editor')).toBe(editor);
			expect(editor.contains(document.activeElement)).toBe(true);
		}

		expect(editor.querySelector('.cm-content')?.textContent).toContain('abc');
	});

	it('applies outside value writes', async () => {
		const { container, rerender } = await render(CodeEditor, { value: 'one' });

		await vi.waitFor(
			() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			},
			{ timeout: 10_000 }
		);

		await rerender({ value: 'two' });

		await vi.waitFor(
			() => {
				expect(container.querySelector('.cm-content')?.textContent).toContain('two');
			},
			{ timeout: 10_000 }
		);
	});
});
