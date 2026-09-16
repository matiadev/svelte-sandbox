<script module lang="ts">
	import type { EditorTheme } from '../types.ts';

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

	async function loadCodeMirror() {
		const modules = await Promise.all([
			import('@codemirror/commands'),
			import('@codemirror/view'),
			import('@codemirror/state'),
			import('@codemirror/language'),
			import('@lezer/highlight'),
			import('@codemirror/lang-html'),
			import('@codemirror/lang-css'),
			import('@codemirror/lang-javascript')
		]);

		// ts cant infer the types through `Object.assign`
		type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (
			k: infer I
		) => void
			? I
			: never;
		type MergeModules<T extends readonly unknown[]> = UnionToIntersection<T[number]>;
		return Object.assign({}, ...modules) as MergeModules<typeof modules>;
	}

	type CodeMirror = Awaited<ReturnType<typeof loadCodeMirror>>;
</script>

<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import type { Language } from './languageMapper.ts';

	interface Props {
		value?: string;
		language?: Language;
		theme?: EditorTheme;
	}

	let { value = $bindable(''), language = 'html', theme }: Props = $props();

	type Editor = (cm: CodeMirror) => Attachment<HTMLDivElement>;
	const editor: Editor =
		({
			history,
			defaultKeymap,
			historyKeymap,
			keymap,
			EditorView,
			lineNumbers,
			highlightSpecialChars,
			drawSelection,
			EditorState,
			HighlightStyle,
			syntaxHighlighting,
			defaultHighlightStyle,
			tags,
			html,
			css,
			javascript
		}) =>
		(container) => {
			const resolved = { ...DEFAULT_EDITOR_THEME, ...theme };

			const lang = { css, javascript, html }[language]();

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

			const view = new EditorView({
				doc: value,
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

			return () => view.destroy();
		};
</script>

{#await loadCodeMirror()}
	<div data-editor></div>
{:then cm}
	<div data-editor {@attach editor(cm)}></div>
{/await}

<style>
	[data-editor] {
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}
</style>
