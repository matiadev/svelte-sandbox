import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { tick } from 'svelte';
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

	describe('resizable panels', () => {
		it('renders a resize handle by default', async () => {
			await render(SvelteSandbox, { files });

			await expect.element(page.getByRole('slider')).toBeInTheDocument();
		});

		it('hides the resize handle when resizable is false', async () => {
			await render(SvelteSandbox, { files, resizable: false });

			await expect.element(page.getByRole('slider')).not.toBeInTheDocument();
		});

		it('hides the resize handle in previewOnly mode', async () => {
			await render(SvelteSandbox, { files, previewOnly: true });

			await expect.element(page.getByRole('slider')).not.toBeInTheDocument();
		});

		it('respects initialSplit and clamps it to min/max', async () => {
			const { container } = await render(SvelteSandbox, { files, initialSplit: 30 });
			expect(container.querySelector('[role="slider"]')?.getAttribute('aria-valuenow')).toBe('30');

			const clamped = await render(SvelteSandbox, { files, initialSplit: 5 });
			expect(
				clamped.container.querySelector('[role="slider"]')?.getAttribute('aria-valuenow')
			).toBe('20');
		});

		it('moves the split with arrow keys', async () => {
			const { container } = await render(SvelteSandbox, { files, initialSplit: 50 });
			const handle = container.querySelector('[role="slider"]') as HTMLElement;

			handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
			await tick();
			expect(handle.getAttribute('aria-valuenow')).toBe('52');

			handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
			await tick();
			expect(handle.getAttribute('aria-valuenow')).toBe('50');
		});

		it('does not move the split on click without dragging', async () => {
			const { container } = await render(SvelteSandbox, { files, initialSplit: 50 });
			const handle = container.querySelector('[role="slider"]') as HTMLElement;

			handle.dispatchEvent(
				new PointerEvent('pointerdown', {
					pointerId: 1,
					clientX: 10,
					clientY: 10,
					bubbles: true
				})
			);
			handle.dispatchEvent(
				new PointerEvent('pointerup', { pointerId: 1, clientX: 10, clientY: 10, bubbles: true })
			);
			await tick();
			expect(handle.getAttribute('aria-valuenow')).toBe('50');
		});

		it('does not take focus on pointer grab', async () => {
			const { container } = await render(SvelteSandbox, { files });
			const handle = container.querySelector('[role="slider"]') as HTMLElement;

			handle.dispatchEvent(
				new PointerEvent('pointerdown', {
					pointerId: 1,
					clientX: 10,
					clientY: 10,
					bubbles: true
				})
			);
			expect(document.activeElement).not.toBe(handle);
			handle.dispatchEvent(
				new PointerEvent('pointerup', { pointerId: 1, clientX: 10, clientY: 10, bubbles: true })
			);
		});
	});
});
