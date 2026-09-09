import { describe, expect, it } from 'vitest';
import { clampSplit, nextSplitFromKey, splitFromDragDelta, SPLIT_BREAKPOINT } from './split.js';

describe('split helpers', () => {
	it('clamps values to min/max', () => {
		expect(clampSplit(50, 20, 80)).toBe(50);
		expect(clampSplit(10, 20, 80)).toBe(20);
		expect(clampSplit(90, 20, 80)).toBe(80);
	});

	it('moves the split by the pointer delta, not the absolute position', () => {
		const rect = { left: 0, top: 0, width: 1000, height: 400 };
		// no movement means no change, wherever the grab happened
		expect(splitFromDragDelta(50, 503, 0, 503, 0, rect, false, 20, 80)).toBe(50);
		// dragging 40px right on a 1000px container adds 4
		expect(splitFromDragDelta(50, 503, 0, 543, 0, rect, false, 20, 80)).toBe(54);
		expect(splitFromDragDelta(50, 503, 0, 463, 0, rect, false, 20, 80)).toBe(46);
	});

	it('clamps the dragged split to min/max', () => {
		const rect = { left: 0, top: 0, width: 1000, height: 400 };
		expect(splitFromDragDelta(50, 500, 0, -100, 0, rect, false, 20, 80)).toBe(20);
		expect(splitFromDragDelta(50, 500, 0, 2000, 0, rect, false, 20, 80)).toBe(80);
	});

	it('uses the vertical delta when stacked', () => {
		const rect = { left: 0, top: 0, width: 400, height: 800 };
		expect(splitFromDragDelta(50, 0, 203, 0, 203, rect, true, 20, 80)).toBe(50);
		expect(splitFromDragDelta(50, 0, 200, 0, 280, rect, true, 20, 80)).toBe(60);
		expect(splitFromDragDelta(50, 0, 200, 0, -2000, rect, true, 20, 80)).toBe(20);
		expect(splitFromDragDelta(50, 0, 200, 0, 2000, rect, true, 20, 80)).toBe(80);
	});

	it('moves split with arrow keys, Home and End', () => {
		expect(nextSplitFromKey(50, 'ArrowRight', false, 20, 80)).toBe(52);
		expect(nextSplitFromKey(50, 'ArrowLeft', false, 20, 80)).toBe(48);
		expect(nextSplitFromKey(50, 'ArrowRight', true, 20, 80)).toBe(60);
		expect(nextSplitFromKey(50, 'Home', false, 20, 80)).toBe(20);
		expect(nextSplitFromKey(50, 'End', false, 20, 80)).toBe(80);
		expect(nextSplitFromKey(50, 'a', false, 20, 80)).toBeNull();
	});

	it('exposes a 700px stacking breakpoint matching the container query', () => {
		expect(SPLIT_BREAKPOINT).toBe(700);
	});
});
