export const language = {
	svelte: 'html',
	html: 'html',
	css: 'css',
	script: 'javascript',
	js: 'javascript'
} as const;

export type Language = (typeof language)[keyof typeof language];
