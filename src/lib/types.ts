import type { ClassValue } from 'svelte/elements';
import type { Language } from './editor/languageMapper.ts';
import type { Slots } from './preview/renderCode.ts';
import type { Collector } from './preview/imports.ts';

export interface Code {
	html?: string;
	css?: string;
	script?: string;
}

export interface SandboxFile {
	name: string;
	label?: string;
	language: Language;
	content: string;
}

export interface EditorConfig {
	enable?: boolean;
	name?: string;
	theme?: EditorTheme;
}

export interface Theme {
	bg?: string;
	border?: string;
	accent?: string;
	text?: string;
	textMuted?: string;
	error?: string;
	tabFontSize?: string;
	radius?: string;
	borderW?: string;
	fontFamily?: string;
	fontSize?: string;
}

export interface EditorTheme {
	accent?: string;
	function?: string;
	variable?: string;
	muted?: string;
	comment?: string;
	special?: string;
	text?: string;
	gutter?: string;
	fontSize?: string;
	fontFamily?: string;
}

export interface SplitConfig {
	initial?: number;
	min?: number;
	max?: number;
}

export interface SandboxConfig {
	width?: string | number;
	height?: string | number;
	class?: ClassValue;
	resizable?: SplitConfig | false;
}

export interface PreviewConfig {
	enable?: boolean;
	name?: string;
	build: (collector: Collector) => Slots;
	errors?: string[];
}

export interface SharedProps {
	sandbox?: SandboxConfig;
	editor?: EditorConfig;
	preview?: Omit<PreviewConfig, 'build'>;
	theme?: Theme;
}
