<script lang="ts">
	import type { Splitter } from './split.svelte.js';

	interface Props {
		splitter: Splitter;
	}

	let { splitter }: Props = $props();
</script>

<div {...splitter.handle} {@attach splitter.attachDivider}></div>

<style>
	[role='slider'] {
		--divider-size: 8px;
		--divider-line: 1px;

		position: relative;
		flex: 0 0 auto;
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
		background: transparent;
		outline: none;
		z-index: 2;

		&[aria-orientation='horizontal'] {
			width: var(--divider-size);
			align-self: stretch;
			cursor: col-resize;
		}

		&[aria-orientation='vertical'] {
			height: var(--divider-size);
			width: 100%;
			cursor: row-resize;
		}

		&::after {
			content: '';
			position: absolute;
			background: var(--border, #29303d);
			transition: background 0.15s;
		}

		&[aria-orientation='horizontal']::after {
			top: 0;
			bottom: 0;
			left: 50%;
			width: var(--divider-line);
			transform: translateX(-50%);
		}

		&[aria-orientation='vertical']::after {
			left: 0;
			right: 0;
			top: 50%;
			height: var(--divider-line);
			transform: translateY(-50%);
		}

		&:hover::after,
		&:focus-visible::after,
		&[data-dragging]::after {
			background: var(--accent, #52ffeb);
		}

		&:focus-visible:not([data-dragging]) {
			outline: 1px solid var(--accent, #52ffeb);
			outline-offset: -1px;
		}
	}
</style>
