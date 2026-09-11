<script lang="ts">
	import { on } from 'svelte/events';
	import { nextSplitFromKey, splitFromDragDelta } from './split.js';

	interface Props {
		split?: number;
		stacked?: boolean;
		min?: number;
		max?: number;
		dragging?: boolean;
	}

	let {
		split = $bindable(50),
		stacked = false,
		min = 20,
		max = 80,
		dragging = $bindable(false)
	}: Props = $props();

	/*
	 * Grab point recorded at drag start.
	 * Moves apply as a delta so a click without dragging never moves the split.
	 */
	let dragStart: { id: number; x: number; y: number; split: number } | null = null;

	function resetBodyStyles() {
		document.body.style.cursor = '';
		document.body.style.userSelect = '';
	}

	/**
	 * Drag + keyboard behavior for the divider element.
	 * Props are only read inside listeners (not at attach time) so the
	 * attachment never re-binds on unrelated state changes.
	 */
	function dragHandle(node: HTMLDivElement) {
		function handlePointerDown(event: PointerEvent) {
			dragging = true;
			dragStart = { id: event.pointerId, x: event.clientX, y: event.clientY, split };
			try {
				node.setPointerCapture(event.pointerId);
			} catch {
				// noop for synthetic or stale pointer id
			}
			document.body.style.cursor = stacked ? 'row-resize' : 'col-resize';
			document.body.style.userSelect = 'none';
			event.preventDefault();
		}

		function handlePointerMove(event: PointerEvent) {
			if (!dragging || !dragStart || event.pointerId !== dragStart.id) return;
			const rect = node.parentElement?.getBoundingClientRect();
			if (!rect) return;
			split = splitFromDragDelta(
				dragStart.split,
				dragStart.x,
				dragStart.y,
				event.clientX,
				event.clientY,
				rect,
				stacked,
				min,
				max
			);
			event.preventDefault();
		}

		function handlePointerUp(event: PointerEvent) {
			if (!dragging) return;
			dragging = false;
			dragStart = null;
			resetBodyStyles();
			try {
				node.releasePointerCapture(event.pointerId);
			} catch {
				// noop when capture is already released
			}
		}

		function handleKeyDown(event: KeyboardEvent) {
			const next = nextSplitFromKey(split, event.key, event.shiftKey, min, max);
			if (next !== null) {
				split = next;
				event.preventDefault();
			}
		}

		const teardowns = [
			on(node, 'pointerdown', handlePointerDown),
			on(node, 'pointermove', handlePointerMove),
			on(node, 'pointerup', handlePointerUp),
			on(node, 'pointercancel', handlePointerUp),
			on(node, 'keydown', handleKeyDown)
		];

		return () => {
			teardowns.forEach((teardown) => teardown());
			resetBodyStyles();
		};
	}
</script>

<div
	class="divider"
	class:stacked
	class:dragging
	role="slider"
	aria-orientation={stacked ? 'horizontal' : 'vertical'}
	aria-valuenow={Math.round(split)}
	aria-valuemin={min}
	aria-valuemax={max}
	aria-label="Resize panels"
	tabindex={0}
	{@attach dragHandle}
></div>

<style>
	.divider {
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
	}

	.divider:not(.stacked) {
		width: var(--divider-size);
		align-self: stretch;
		cursor: col-resize;
	}

	.divider.stacked {
		height: var(--divider-size);
		width: 100%;
		cursor: row-resize;
	}

	.divider::after {
		content: '';
		position: absolute;
		background: var(--border, #29303d);
		transition: background 0.15s;
	}

	.divider:not(.stacked)::after {
		top: 0;
		bottom: 0;
		left: 50%;
		width: var(--divider-line);
		transform: translateX(-50%);
	}

	.divider.stacked::after {
		left: 0;
		right: 0;
		top: 50%;
		height: var(--divider-line);
		transform: translateY(-50%);
	}

	.divider:hover::after,
	.divider:focus-visible::after,
	.divider.dragging::after {
		background: var(--accent, #52ffeb);
	}

	.divider:focus-visible:not(.dragging) {
		outline: 1px solid var(--accent, #52ffeb);
		outline-offset: -1px;
	}
</style>
