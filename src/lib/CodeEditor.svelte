<script lang="ts">
	import { untrack } from 'svelte';

	interface Props {
		value?: string;
		language?: string;
		theme?: {
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
		};
	}

	let { value = $bindable(''), language = 'html', theme }: Props = $props();

	function editor(container: HTMLElement) {
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

			const lang = language === 'css' ? css() : language === 'javascript' ? javascript() : html();

			const minimalSetup = [
				highlightSpecialChars(),
				history(),
				drawSelection(),
				syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
				keymap.of([...defaultKeymap, ...historyKeymap])
			];

			const poimandresHighlight = HighlightStyle.define([
				{ tag: tags.keyword, color: theme?.accent ?? '#5de4c7' },
				{ tag: tags.string, color: theme?.accent ?? '#5de4c7' },
				{ tag: tags.number, color: theme?.accent ?? '#5de4c7' },
				{ tag: tags.tagName, color: theme?.accent ?? '#5de4c7' },
				{ tag: tags.function(tags.variableName), color: theme?.function ?? '#add7ff' },
				{ tag: tags.className, color: theme?.function ?? '#add7ff' },
				{ tag: tags.variableName, color: theme?.variable ?? '#e4f0fb' },
				{ tag: tags.propertyName, color: theme?.variable ?? '#e4f0fb' },
				{ tag: tags.typeName, color: theme?.muted ?? '#a6accd' },
				{ tag: tags.punctuation, color: theme?.muted ?? '#a6accd' },
				{ tag: tags.operator, color: theme?.muted ?? '#91b4d5' },
				{ tag: tags.attributeName, color: theme?.muted ?? '#91b4d5' },
				{ tag: tags.comment, color: theme?.comment ?? '#767c9d' },
				{ tag: tags.bool, color: theme?.special ?? '#d0679d' },
				{ tag: tags.null, color: theme?.special ?? '#d0679d' }
			]);

			const poimandresTheme = EditorView.theme(
				{
					'&': {
						fontSize: theme?.fontSize ?? '14px',
						color: theme?.text ?? '#fff',
						height: '100%'
					},
					'& .cm-scroller': {
						fontFamily: theme?.fontFamily ?? 'JetBrains Mono'
					},
					'.cm-gutters': {
						background: 'transparent',
						color: theme?.gutter ?? '#767c9d',
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
		return () => view?.destroy();
	}
</script>

<div class="editor" {@attach editor}></div>

<style>
	.editor {
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}
</style>
