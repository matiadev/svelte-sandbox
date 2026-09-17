import { SPLIT_DEFAULT, SPLIT_MAX, SPLIT_MIN } from './split.js';
import type { ClassValue } from 'svelte/elements';
import type { SandboxConfig } from '../types.js';

interface FlatSandboxProps {
	width?: string | number;
	height?: string | number;
	classes?: ClassValue;
	resizable?: boolean;
	initialSplit?: number;
	minSplit?: number;
	maxSplit?: number;
}

export function toSandboxConfig({
	width = '100%',
	height = '100%',
	classes = '',
	resizable = true,
	initialSplit = SPLIT_DEFAULT,
	minSplit = SPLIT_MIN,
	maxSplit = SPLIT_MAX
}: FlatSandboxProps = {}): SandboxConfig {
	return {
		width,
		height,
		classes,
		resizable: resizable ? { initial: initialSplit, min: minSplit, max: maxSplit } : false
	};
}
