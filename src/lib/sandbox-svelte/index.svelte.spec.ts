import { tick } from 'svelte';
import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import SvelteSandbox from './index.svelte';

const files = {
	'App.svelte': '<h1>Hello</h1>',
	'util.js': 'export const a = 1;'
};

describe('SvelteSandbox.svelte', () => {
	it('renders a tab per file', async () => {
		render(SvelteSandbox, { files });

		await expect.element(page.getByRole('tab', { name: 'App.svelte' })).toBeInTheDocument();
		await expect.element(page.getByRole('tab', { name: 'util.js' })).toBeInTheDocument();
	});

	it('hides the editor when disabled', async () => {
		render(SvelteSandbox, { files, editor: { enable: false } });

		await expect.element(page.getByTitle('Svelte preview')).toBeInTheDocument();
		await expect.element(page.getByRole('tab', { name: 'App.svelte' })).not.toBeInTheDocument();
	});

	it('hides the preview when disabled', async () => {
		render(SvelteSandbox, { files, preview: { enable: false } });

		await expect.element(page.getByTitle('Svelte preview')).not.toBeInTheDocument();
		await expect.element(page.getByRole('tab', { name: 'App.svelte' })).toBeInTheDocument();
	});

	describe('resizable panels', () => {
		it('renders a resize handle by default', async () => {
			await render(SvelteSandbox, { files });

			await expect.element(page.getByRole('slider')).toBeInTheDocument();
		});

		it('hides the resize handle when resizable is false', async () => {
			await render(SvelteSandbox, { files, sandbox: { resizable: false } });

			await expect.element(page.getByRole('slider')).not.toBeInTheDocument();
		});

		it('hides the resize handle when only the editor is hidden', async () => {
			await render(SvelteSandbox, { files, editor: { enable: false } });

			await expect.element(page.getByRole('slider')).not.toBeInTheDocument();
		});

		it('hides the resize handle when only the preview is hidden', async () => {
			await render(SvelteSandbox, { files, preview: { enable: false } });

			await expect.element(page.getByRole('slider')).not.toBeInTheDocument();
		});

		it('respects initial and clamps it to min/max', async () => {
			const { container } = await render(SvelteSandbox, {
				files,
				sandbox: { resizable: { initial: 30 } }
			});
			expect(container.querySelector('[role="slider"]')?.getAttribute('aria-valuenow')).toBe('30');

			const clamped = await render(SvelteSandbox, {
				files,
				sandbox: { resizable: { initial: 5 } }
			});
			expect(
				clamped.container.querySelector('[role="slider"]')?.getAttribute('aria-valuenow')
			).toBe('20');
		});

		it('re-reads min/max from props after mount', async () => {
			const { container, rerender } = await render(SvelteSandbox, {
				files,
				sandbox: { resizable: { min: 20 } }
			});
			const handle = container.querySelector('[role="slider"]') as HTMLElement;
			expect(handle.getAttribute('aria-valuemin')).toBe('20');

			await rerender({ sandbox: { resizable: { min: 40 } } });
			handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
			await tick();
			expect(handle.getAttribute('aria-valuenow')).toBe('40');
		});

		it('moves the split with arrow keys', async () => {
			const { container } = await render(SvelteSandbox, {
				files,
				sandbox: { resizable: { initial: 50 } }
			});
			const handle = container.querySelector('[role="slider"]') as HTMLElement;

			handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
			await tick();
			expect(handle.getAttribute('aria-valuenow')).toBe('52');

			handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
			await tick();
			expect(handle.getAttribute('aria-valuenow')).toBe('50');
		});

		it('does not move the split on click without dragging', async () => {
			const { container } = await render(SvelteSandbox, {
				files,
				sandbox: { resizable: { initial: 50 } }
			});
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
