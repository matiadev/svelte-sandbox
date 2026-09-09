<script lang="ts">
	interface Props {
		stacked?: boolean;
		split?: number;
		min?: number;
		max?: number;
		dragging?: boolean;
		onpointerdown: (event: PointerEvent) => void;
		onpointermove: (event: PointerEvent) => void;
		onpointerup: (event: PointerEvent) => void;
		onpointercancel: (event: PointerEvent) => void;
		onkeydown: (event: KeyboardEvent) => void;
	}

	const {
		stacked = false,
		split = 50,
		min = 20,
		max = 80,
		dragging = false,
		onpointerdown,
		onpointermove,
		onpointerup,
		onpointercancel,
		onkeydown
	}: Props = $props();
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
	{onpointerdown}
	{onpointermove}
	{onpointerup}
	{onpointercancel}
	{onkeydown}
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
