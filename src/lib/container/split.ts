export const SPLIT_BREAKPOINT = 700;
export const SPLIT_DEFAULT = 50;
export const SPLIT_MIN = 20;
export const SPLIT_MAX = 80;
export const SPLIT_KEYBOARD_STEP = 2;
export const SPLIT_KEYBOARD_LARGE_STEP = 10;

export function clampSplit(value: number, min: number, max: number): number {
	const lo = Math.min(min, max);
	const hi = Math.max(min, max);
	if (Number.isNaN(value)) return lo;
	return Math.min(hi, Math.max(lo, value));
}

export function splitFromDragDelta(
	startSplit: number,
	startX: number,
	startY: number,
	clientX: number,
	clientY: number,
	rect: { left: number; top: number; width: number; height: number },
	stacked: boolean,
	min: number,
	max: number
): number {
	if (stacked) {
		if (rect.height <= 0) return clampSplit(startSplit, min, max);
		return clampSplit(startSplit + ((clientY - startY) / rect.height) * 100, min, max);
	}
	if (rect.width <= 0) return clampSplit(startSplit, min, max);
	return clampSplit(startSplit + ((clientX - startX) / rect.width) * 100, min, max);
}

export function nextSplitFromKey(
	current: number,
	key: string,
	shiftKey: boolean,
	min: number,
	max: number
): number | null {
	const large = shiftKey ? SPLIT_KEYBOARD_LARGE_STEP : SPLIT_KEYBOARD_STEP;
	switch (key) {
		case 'ArrowLeft':
		case 'ArrowUp':
			return clampSplit(current - large, min, max);
		case 'ArrowRight':
		case 'ArrowDown':
			return clampSplit(current + large, min, max);
		case 'Home':
			return clampSplit(min, min, max);
		case 'End':
			return clampSplit(max, min, max);
		default:
			return null;
	}
}
