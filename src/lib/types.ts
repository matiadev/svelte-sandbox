export interface Code {
	html?: string;
	css?: string;
	script?: string;
}

export interface Theme {
	bg?: string;
	border?: string;
	accent?: string;
	text?: string;
	textMuted?: string;
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

export interface SharedProps {
	width?: string | number;
	height?: string | number;
	theme?: Theme;
	editorTheme?: EditorTheme;
	previewOnly?: boolean;
	classes?: string;
	resizable?: boolean;
	initialSplit?: number;
	minSplit?: number;
	maxSplit?: number;
}
