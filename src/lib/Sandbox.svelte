<script lang="ts">
	import { untrack } from 'svelte';
	import type { Snippet } from 'svelte';
	import SplitDivider from './SplitDivider.svelte';
	import { SPLIT_BREAKPOINT, clampSplit, nextSplitFromKey, splitFromDragDelta } from './split.js';

	interface Theme {
		bg?: string;
		border?: string;
		accent?: string;
		text?: string;
		textMuted?: string;
		tabFontSize?: string;
		radius?: string;
		borderW?: string;
		fontFamily?: string;
		fontSize?: string;
	}

	interface Props {
		width?: string | number;
		height?: string | number;
		classes?: string;
		theme?: Theme;
		previewOnly?: boolean;
		resizable?: boolean;
		initial?: number;
		min?: number;
		max?: number;
		editor?: Snippet;
		preview: Snippet;
	}

	const {
		width = '100%',
		height = '100%',
		classes = '',
		theme,
		previewOnly = false,
		resizable = true,
		initial = 50,
		min = 20,
		max = 80,
		editor,
		preview
	}: Props = $props();

	// uncontrolled split, intentionally reads props only once
	let split = $state(
		clampSplit(
			untrack(() => initial),
			untrack(() => min),
			untrack(() => max)
		)
	);
	let stacked = $state(false);
	let dragging = $state(false);
	let containerEl: HTMLDivElement | undefined = $state();
	let sandboxEl: HTMLDivElement | undefined = $state();
	/*
	 * Grab point recorded at drag start.
	 * Moves apply as a delta so a click without dragging never moves the split.
	 */
	let dragStart: { id: number; x: number; y: number; split: number } | null = null;

	function updateSplitFromDrag(clientX: number, clientY: number) {
		if (!dragStart) return;
		const rect = (sandboxEl ?? containerEl)?.getBoundingClientRect();
		if (!rect) return;
		split = splitFromDragDelta(
			dragStart.split,
			dragStart.x,
			dragStart.y,
			clientX,
			clientY,
			rect,
			stacked,
			min,
			max
		);
	}

	function handleDividerPointerDown(event: PointerEvent) {
		if (!resizable || previewOnly) return;
		dragging = true;
		dragStart = { id: event.pointerId, x: event.clientX, y: event.clientY, split };
		try {
			(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
		} catch {
			// noop for synthetic or stale pointer id
		}
		document.body.style.cursor = stacked ? 'row-resize' : 'col-resize';
		document.body.style.userSelect = 'none';
		event.preventDefault();
	}

	function handleDividerPointerMove(event: PointerEvent) {
		if (!dragging || !dragStart || event.pointerId !== dragStart.id) return;
		updateSplitFromDrag(event.clientX, event.clientY);
		event.preventDefault();
	}

	function handleDividerPointerUp(event: PointerEvent) {
		if (!dragging) return;
		dragging = false;
		dragStart = null;
		document.body.style.cursor = '';
		document.body.style.userSelect = '';
		try {
			(event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
		} catch {
			// noop when capture is already released
		}
	}

	function handleDividerKey(event: KeyboardEvent) {
		const next = nextSplitFromKey(split, event.key, event.shiftKey, min, max);
		if (next !== null) {
			split = next;
			event.preventDefault();
		}
	}

	$effect(() => {
		const el = containerEl;
		if (!el) return;
		const update = () => {
			stacked = el.clientWidth <= SPLIT_BREAKPOINT;
		};
		update();
		const observer = new ResizeObserver(update);
		observer.observe(el);
		return () => observer.disconnect();
	});

	$effect(() => {
		return () => {
			document.body.style.cursor = '';
			document.body.style.userSelect = '';
		};
	});
</script>

<div
	class="sandbox-container {classes}"
	bind:this={containerEl}
	style:width={typeof width === 'number' ? `${width}px` : width}
	style:height={typeof height === 'number' ? `${height}px` : height}
>
	<div
		class="sandbox"
		bind:this={sandboxEl}
		class:preview-only={previewOnly}
		class:dragging
		class:has-divider={resizable && !previewOnly}
		style:--bg={theme?.bg}
		style:--border={theme?.border}
		style:--accent={theme?.accent}
		style:--text={theme?.text}
		style:--text-muted={theme?.textMuted}
		style:--radius={theme?.radius}
		style:--tab-font-size={theme?.tabFontSize}
		style:--border-w={theme?.borderW}
		style:--font-family={theme?.fontFamily}
		style:--font-size={theme?.fontSize}
		style:--split="{split}%"
	>
		{#if !previewOnly}
			<div class="sidebar">
				{@render editor?.()}
			</div>
			{#if resizable}
				<SplitDivider
					{stacked}
					{split}
					{min}
					{max}
					{dragging}
					onpointerdown={handleDividerPointerDown}
					onpointermove={handleDividerPointerMove}
					onpointerup={handleDividerPointerUp}
					onpointercancel={handleDividerPointerUp}
					onkeydown={handleDividerKey}
				/>
			{/if}
		{/if}

		<div class="preview">
			{@render preview()}
		</div>
	</div>
</div>

<style>
	.sandbox-container {
		container-type: inline-size;
	}

	.sandbox,
	.sandbox > * {
		box-sizing: border-box;
	}

	.sandbox {
		--bg: #1b1e27;
		--border: #29303d;
		--accent: #52ffeb;
		--text-muted: #c2c7d6;
		--text: #e4f0fb;
		--tab-font-size: 1rem;
		--radius: 0.5rem;
		--split: 50%;
		--border-w: 1px;
		--font-family: 'Atkinson Hyperlegible', sans-serif;
		--font-size: 1rem;

		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		font-family: var(--font-family);
		font-size: var(--font-size);
		background: var(--bg);
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius);
		overflow: hidden;

		@container (width > 700px) {
			flex-direction: row;
		}

		&.dragging {
			user-select: none;
			-webkit-user-select: none;
		}

		&.dragging .preview :global(iframe) {
			pointer-events: none;
		}

		.sidebar {
			width: 100%;
			height: var(--split);
			flex: 0 0 auto;
			display: flex;
			flex-direction: column;
			background: var(--bg);
			border-bottom: var(--border-w) solid var(--border);
			overflow: hidden;
			min-height: 0;

			@container (width > 700px) {
				width: var(--split);
				height: 100%;
				border-right: var(--border-w) solid var(--border);
				border-bottom: none;
			}
		}

		&.has-divider .sidebar {
			border-bottom: none;

			@container (width > 700px) {
				border-right: none;
			}
		}

		.preview {
			position: relative;
			width: 100%;
			flex: 1 1 0;
			min-height: 0;
			overflow: hidden;

			@container (width > 700px) {
				width: auto;
				height: 100%;
				flex: 1 1 0;
				min-width: 0;
				min-height: auto;
			}

			:global(iframe) {
				width: 100%;
				height: 100%;
				display: block;
				border: none;
			}

			.preview-only & {
				width: 100%;
				height: 100%;
				flex: 1 1 auto;
			}
		}
	}
</style>
