<script lang="ts">
	import { untrack } from 'svelte';
	import type { Snippet } from 'svelte';
	import SplitDivider from './SplitDivider2.svelte';
	import { SPLIT_BREAKPOINT, clampSplit } from './split.js';
	import type { Theme } from './types.js';
	import type { ClassValue } from 'svelte/elements';
	import type { Attachment } from 'svelte/attachments';

	interface Props {
		width?: string | number;
		height?: string | number;
		classes?: ClassValue;
		theme?: Theme;
		previewOnly?: boolean;
		resizable?: boolean;
		initial?: number;
		min?: number;
		max?: number;
		editor: Snippet;
		preview: Snippet<[boolean]>;
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
	const observeStacked: Attachment<HTMLDivElement> = (node) => {
		const update = () => {
			stacked = node.clientWidth <= SPLIT_BREAKPOINT;
		};
		update();
		const observer = new ResizeObserver(update);
		observer.observe(node);
		return () => observer.disconnect();
	};
</script>

<div
	class="sandbox-container {classes}"
	{@attach observeStacked}
	style:width={typeof width === 'number' ? `${width}px` : width}
	style:height={typeof height === 'number' ? `${height}px` : height}
>
	<div
		class="sandbox"
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
				<SplitDivider bind:split bind:dragging {stacked} {min} {max} />
			{/if}
		{/if}

		<div class="preview">
			{let reloadKey = $state(false)}
			{@render preview(reloadKey)}
			<button
				class="reload-button"
				onclick={() => (reloadKey = !reloadKey)}
				aria-label="Reload preview"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
					<path d="M3 3v5h5" />
				</svg>
			</button>
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

	.reload-button {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		padding: 0.25rem;
		color: var(--text-muted);
		background: var(--bg);
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius);
		cursor: pointer;
		transition: color 0.1s;

		&:hover {
			color: var(--text);
		}

		svg {
			width: 1.25rem;
			height: 1.25rem;
			display: block;
		}
	}
</style>
