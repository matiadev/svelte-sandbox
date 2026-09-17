import { on } from 'svelte/events';
import {
	SPLIT_BREAKPOINT,
	SPLIT_DEFAULT,
	SPLIT_MAX,
	SPLIT_MIN,
	clampSplit,
	nextSplitFromKey,
	splitFromDragDelta
} from './split.js';
import type { Attachment } from 'svelte/attachments';
import type { HTMLAttributes } from 'svelte/elements';

interface Drag {
	id: number;
	x: number;
	y: number;
	split: number;
	width: number;
	height: number;
}

interface SplitterOptions {
	initial?: number;
	min?: () => number | undefined;
	max?: () => number | undefined;
	breakpoint?: number;
}

export class Splitter {
	split = $state(SPLIT_DEFAULT);
	stacked = $state(false);
	dragging = $state(false);

	#breakpoint: number;
	#min: () => number = () => SPLIT_MIN;
	#max: () => number = () => SPLIT_MAX;
	#drag: Drag | null = null;

	constructor(options: SplitterOptions = {}) {
		this.#breakpoint = options.breakpoint ?? SPLIT_BREAKPOINT;
		this.#min = () => options.min?.() ?? SPLIT_MIN;
		this.#max = () => options.max?.() ?? SPLIT_MAX;
		// uncontrolled initial value, read once
		this.split = clampSplit(options.initial ?? SPLIT_DEFAULT, this.#min(), this.#max());
	}

	handle: HTMLAttributes<HTMLDivElement> = $derived({
		role: 'slider',
		'data-dragging': this.dragging ? 'true' : undefined,
		'aria-orientation': this.stacked ? 'vertical' : 'horizontal',
		'aria-valuenow': Math.round(this.split),
		'aria-valuemin': this.#min(),
		'aria-valuemax': this.#max(),
		'aria-valuetext': `${Math.round(this.split)} percent`,
		'aria-label': 'Resize panels',
		tabindex: 0
	});

	/** Attach to the container to track stacking. */
	attachContainer: Attachment<HTMLDivElement> = (node) => {
		const update = () => {
			this.stacked = node.clientWidth <= this.#breakpoint;
		};
		update();
		const observer = new ResizeObserver(update);
		observer.observe(node);
		return () => observer.disconnect();
	};

	/** Attach to the divider element for drag and keyboard behavior. */
	attachDivider: Attachment<HTMLDivElement> = (node) => {
		const handlePointerDown = (event: PointerEvent) => {
			const rect = node.parentElement?.getBoundingClientRect();
			this.dragging = true;
			this.#drag = {
				id: event.pointerId,
				x: event.clientX,
				y: event.clientY,
				split: this.split,
				width: rect?.width ?? 0,
				height: rect?.height ?? 0
			};
			try {
				node.setPointerCapture(event.pointerId);
			} catch {
				// noop for synthetic or stale pointer id
			}
			document.body.style.cursor = this.stacked ? 'row-resize' : 'col-resize';
			document.body.style.userSelect = 'none';
			event.preventDefault();
		};

		const handlePointerMove = (event: PointerEvent) => {
			const drag = this.#drag;
			if (!this.dragging || !drag || event.pointerId !== drag.id) return;
			this.split = splitFromDragDelta(
				drag.split,
				drag.x,
				drag.y,
				event.clientX,
				event.clientY,
				drag,
				this.stacked,
				this.#min(),
				this.#max()
			);
			event.preventDefault();
		};

		const handlePointerUp = (event: PointerEvent) => {
			if (!this.dragging) return;
			this.dragging = false;
			this.#drag = null;
			this.#resetBodyStyles();
			try {
				node.releasePointerCapture(event.pointerId);
			} catch {
				// noop when capture is already released
			}
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			const next = nextSplitFromKey(
				this.split,
				event.key,
				event.shiftKey,
				this.#min(),
				this.#max()
			);
			if (next !== null) {
				this.split = next;
				event.preventDefault();
			}
		};

		const teardowns = [
			on(node, 'pointerdown', handlePointerDown),
			on(node, 'pointermove', handlePointerMove),
			on(node, 'pointerup', handlePointerUp),
			on(node, 'pointercancel', handlePointerUp),
			on(node, 'keydown', handleKeyDown)
		];

		return () => {
			teardowns.forEach((teardown) => teardown());
			this.dragging = false;
			this.#drag = null;
			this.#resetBodyStyles();
		};
	};

	#resetBodyStyles() {
		document.body.style.cursor = '';
		document.body.style.userSelect = '';
	}
}
