<script module lang="ts">
	import type { Language } from './languageMapper.js';
	import type { EditorTheme } from '../types.js';

	type Editor = Awaited<ReturnType<typeof loadEditor>>;

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

	async function loadEditor() {
		const [commands, view, state, language, highlight, htmlLang, cssLang, jsLang] =
			await Promise.all([
				import('@codemirror/commands'),
				import('@codemirror/view'),
				import('@codemirror/state'),
				import('@codemirror/language'),
				import('@lezer/highlight'),
				import('@codemirror/lang-html'),
				import('@codemirror/lang-css'),
				import('@codemirror/lang-javascript')
			]);
		return {
			...commands,
			...view,
			...state,
			...language,
			...highlight,
			...htmlLang,
			...cssLang,
			...jsLang
		};
	}

	let editorPromise: Promise<Editor> | undefined;

	function getEditor(): Promise<Editor> {
		editorPromise ??= loadEditor();
		return editorPromise;
	}

	function languageExtension(editor: Editor, lang: Language) {
		return { css: editor.css, javascript: editor.javascript, html: editor.html }[lang]();
	}

	function appearanceExtensions(editor: Editor, theme: EditorTheme | undefined) {
		const resolved = { ...DEFAULT_EDITOR_THEME, ...theme };

		const highlight = editor.HighlightStyle.define([
			{ tag: editor.tags.keyword, color: resolved.accent },
			{ tag: editor.tags.string, color: resolved.accent },
			{ tag: editor.tags.number, color: resolved.accent },
			{ tag: editor.tags.tagName, color: resolved.accent },
			{ tag: editor.tags.function(editor.tags.variableName), color: resolved.function },
			{ tag: editor.tags.className, color: resolved.function },
			{ tag: editor.tags.variableName, color: resolved.variable },
			{ tag: editor.tags.propertyName, color: resolved.variable },
			{ tag: editor.tags.typeName, color: resolved.muted },
			{ tag: editor.tags.punctuation, color: resolved.muted },
			{ tag: editor.tags.operator, color: theme?.muted ?? '#91b4d5' },
			{ tag: editor.tags.attributeName, color: theme?.muted ?? '#91b4d5' },
			{ tag: editor.tags.comment, color: resolved.comment },
			{ tag: editor.tags.bool, color: resolved.special },
			{ tag: editor.tags.null, color: resolved.special }
		]);

		const themeExtension = editor.EditorView.theme(
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

		return [editor.syntaxHighlighting(highlight), themeExtension];
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import type { EditorView } from '@codemirror/view';
	import type { Compartment } from '@codemirror/state';

	interface Props {
		value?: string;
		language?: Language;
		theme?: EditorTheme;
	}

	let { value = $bindable(''), language = 'html', theme }: Props = $props();

	// load editor modules once so typing never reloads them
	const modules = getEditor();

	let view = $state<EditorView | undefined>(undefined);
	let editor = $state<Editor | undefined>(undefined);
	let languageCompartment = $state<Compartment | undefined>(undefined);
	let appearanceCompartment = $state<Compartment | undefined>(undefined);

	// attach once so the view survives rerenders
	const attachEditor: Attachment<HTMLDivElement> = (container) => {
		let cancelled = false;
		let currentView: EditorView | undefined;

		modules.then((mods) => {
			if (cancelled) return;

			const initialDoc = untrack(() => value);
			const initialLanguage = untrack(() => language);
			const initialTheme = untrack(() => theme);

			const lang = new mods.Compartment();
			const appearance = new mods.Compartment();

			const minimalSetup = [
				mods.highlightSpecialChars(),
				mods.history(),
				mods.drawSelection(),
				mods.syntaxHighlighting(mods.defaultHighlightStyle, { fallback: true }),
				mods.keymap.of([...mods.defaultKeymap, ...mods.historyKeymap])
			];

			currentView = new mods.EditorView({
				doc: initialDoc,
				extensions: [
					minimalSetup,
					mods.lineNumbers(),
					lang.of(languageExtension(mods, initialLanguage)),
					appearance.of(appearanceExtensions(mods, initialTheme)),
					mods.EditorState.tabSize.of(2),
					mods.EditorView.updateListener.of((update) => {
						if (update.docChanged) value = update.state.doc.toString();
					})
				],
				parent: container
			});

			editor = mods;
			languageCompartment = lang;
			appearanceCompartment = appearance;
			view = currentView;
		});

		return () => {
			cancelled = true;
			currentView?.destroy();
			currentView = undefined;
			view = undefined;
			editor = undefined;
			languageCompartment = undefined;
			appearanceCompartment = undefined;
		};
	};

	// apply parent value changes to the view and skip edits that came from the view
	$effect(() => {
		const next = value;
		untrack(() => {
			if (!view) return;
			const current = view.state.doc.toString();
			if (next !== current) {
				view.dispatch({ changes: { from: 0, to: current.length, insert: next } });
			}
		});
	});

	// switch language and theme without rebuilding the view
	$effect(() => {
		const nextLanguage = language;
		const nextTheme = theme;
		untrack(() => {
			if (!view || !editor || !languageCompartment || !appearanceCompartment) return;
			view.dispatch({
				effects: [
					languageCompartment.reconfigure(languageExtension(editor, nextLanguage)),
					appearanceCompartment.reconfigure(appearanceExtensions(editor, nextTheme))
				]
			});
		});
	});
</script>

<div class="editor" {@attach attachEditor}></div>

<style>
	.editor {
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}
</style>
