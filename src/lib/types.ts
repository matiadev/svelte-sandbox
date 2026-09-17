import type { ClassValue } from 'svelte/elements';
import type { Language } from './editor/languageMapper.js';
import type { PreviewHTML } from './preview/renderCode.js';
import type { ImportCollector } from './preview/imports.js';

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

/** Internal container config; becomes the public props shape in the next step. */
export interface SplitConfig {
	initial?: number;
	min?: number;
	max?: number;
}

export interface SandboxConfig {
	width?: string | number;
	height?: string | number;
	classes?: ClassValue;
	resizable?: SplitConfig | false;
}

export interface EditorConfig {
	enable?: boolean;
	name?: string;
	theme?: EditorTheme;
}

export interface PreviewConfig {
	enable?: boolean;
	name?: string;
	buildPreview: (collector: ImportCollector) => PreviewHTML;
	errors?: string[];
}

export interface SharedProps {
	width?: string | number;
	height?: string | number;
	theme?: Theme;
	editorTheme?: EditorTheme;
	previewOnly?: boolean;
	classes?: ClassValue;
	previewTitle?: string;
	resizable?: boolean;
	initialSplit?: number;
	minSplit?: number;
	maxSplit?: number;
}
