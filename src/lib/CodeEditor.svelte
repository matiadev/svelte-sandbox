<script module lang="ts">
	import type { EditorTheme } from './types.js';

	export const DEFAULT_EDITOR_THEME: Required<EditorTheme> = {
		accent: '#5de4c7',
		function: '#add7ff',
		variable: '#e4f0fb',
		muted: '#a6accd',
		comment: '#767c9d',
		special: '#d0679d',
		text: '#fff',
		gutter: '#767c9d',
		fontSize: '14px',
		fontFamily: 'JetBrains Mono'
	};
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import type { Language } from './languageMapper.js';

	interface Props {
		value?: string;
		language?: Language;
		theme?: EditorTheme;
	}

	let { value = $bindable(''), language = 'html', theme }: Props = $props();

	const editor: Attachment<HTMLDivElement> = (container) => {
		let cancelled = false;
		let view: { destroy: () => void } | undefined;

		(async () => {
			const [
				{ history, defaultKeymap, historyKeymap },
				{ keymap, EditorView, lineNumbers, highlightSpecialChars, drawSelection },
				{ EditorState },
				{ HighlightStyle, syntaxHighlighting, defaultHighlightStyle },
				{ tags },
				{ html },
				{ css },
				{ javascript }
			] = await Promise.all([
				import('@codemirror/commands'),
				import('@codemirror/view'),
				import('@codemirror/state'),
				import('@codemirror/language'),
				import('@lezer/highlight'),
				import('@codemirror/lang-html'),
				import('@codemirror/lang-css'),
				import('@codemirror/lang-javascript')
			]);

			if (cancelled) return;

			const resolved = { ...DEFAULT_EDITOR_THEME, ...theme };

			const extensions = { css, javascript, html };
			const lang = extensions[language]();

			const minimalSetup = [
				highlightSpecialChars(),
				history(),
				drawSelection(),
				syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
				keymap.of([...defaultKeymap, ...historyKeymap])
			];

			const poimandresHighlight = HighlightStyle.define([
				{ tag: tags.keyword, color: resolved.accent },
				{ tag: tags.string, color: resolved.accent },
				{ tag: tags.number, color: resolved.accent },
				{ tag: tags.tagName, color: resolved.accent },
				{ tag: tags.function(tags.variableName), color: resolved.function },
				{ tag: tags.className, color: resolved.function },
				{ tag: tags.variableName, color: resolved.variable },
				{ tag: tags.propertyName, color: resolved.variable },
				{ tag: tags.typeName, color: resolved.muted },
				{ tag: tags.punctuation, color: resolved.muted },
				{ tag: tags.operator, color: theme?.muted ?? '#91b4d5' },
				{ tag: tags.attributeName, color: theme?.muted ?? '#91b4d5' },
				{ tag: tags.comment, color: resolved.comment },
				{ tag: tags.bool, color: resolved.special },
				{ tag: tags.null, color: resolved.special }
			]);

			const poimandresTheme = EditorView.theme(
				{
					'&': {
						fontSize: resolved.fontSize,
						color: resolved.text,
						height: '100%'
					},
					'& .cm-scroller': {
						fontFamily: resolved.fontFamily,
						scrollbarWidth: 'thin'
					},
					'& .cm-scroller::-webkit-scrollbar': {
						width: '8px',
						height: '8px'
					},
					'.cm-gutters': {
						background: 'transparent',
						color: resolved.gutter,
						border: 'none'
					},
					'.cm-activeLineGutter': {
						background: 'transparent'
					},
					'& .cm-lineNumbers .cm-gutterElement': {
						minWidth: '30px'
					},
					'.cm-activeLine': {
						background: 'transparent'
					},
					'.cm-content': {
						padding: '1rem 0rem'
					}
				},
				{ dark: true }
			);

			view = new EditorView({
				doc: untrack(() => value),
				extensions: [
					minimalSetup,
					lineNumbers(),
					syntaxHighlighting(poimandresHighlight),
					poimandresTheme,
					lang,
					EditorState.tabSize.of(2),
					EditorView.updateListener.of((update) => {
						if (update.docChanged) value = update.state.doc.toString();
					})
				],
				parent: container
			});
		})();

		return () => {
			cancelled = true;
			view?.destroy();
		};
	};
</script>

<div class="editor" {@attach editor}></div>

<style>
	.editor {
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}
</style>
