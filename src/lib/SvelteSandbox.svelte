<script lang="ts">
	import { untrack } from 'svelte';
	import { VERSION } from 'svelte/compiler';
	import CodeEditor from './CodeEditor.svelte';
	import { compileFiles } from './compile.js';
	import { dedent } from './dedent.js';
	import { collectBareImports, ensureLexerReady } from './imports.js';
	import Sandbox from './Sandbox.svelte';
	import previewHtml from './preview.html?raw';
	import previewRuntime from './preview-runtime.js?raw';

	interface Theme {
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

	interface EditorTheme {
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

	interface Props {
		entry?: string;
		files: Record<string, string>;
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

	const {
		entry = 'App.svelte',
		files: initial,
		width = '100%',
		height = '100%',
		theme,
		editorTheme,
		previewOnly = false,
		classes = '',
		resizable = true,
		initialSplit = 50,
		minSplit = 20,
		maxSplit = 80
	}: Props = $props();

	const filenames = Object.keys(untrack(() => initial));

	let code = $state(Object.fromEntries(filenames.map((name) => [name, dedent(initial[name])])));

	const compiled = $derived(compileFiles(code));

	const compileErrors = $derived(
		Object.entries(compiled.errors).map(([file, message]) => `${file}: ${message}`)
	);

	function buildSrcdoc(lexerReady: boolean) {
		const bareImports = lexerReady ? collectBareImports(code) : [];
		const importMap = {
			imports: Object.assign(
				{
					svelte: `https://esm.sh/svelte@${VERSION}`,
					'svelte/': `https://esm.sh/svelte@${VERSION}/`
				},
				Object.fromEntries(bareImports.map((s) => [s, `https://esm.sh/${s}`]))
			)
		};
		const importmapJson = JSON.stringify(importMap, null, 2);
		const sandboxDataJson = JSON.stringify({ files: compiled.js, entry }).replace(/<\//g, '<\\/');

		return previewHtml
			.split('%IMPORTMAP%')
			.join(importmapJson)
			.split('%SANDBOX_DATA%')
			.join(sandboxDataJson)
			.split('//%SCRIPT%')
			.join(previewRuntime);
	}
</script>

<Sandbox
	{width}
	{height}
	{classes}
	{theme}
	{previewOnly}
	{resizable}
	initial={initialSplit}
	min={minSplit}
	max={maxSplit}
>
	{#snippet editor()}
		{let activeTab = $state(filenames[0] ?? '')}
		{const tabs = $derived(filenames.map((name) => ({ id: name, label: name })))}

		<div class="tabs">
			{#each tabs as tab (tab.id)}
				<button class:active={activeTab === tab.id} onclick={() => (activeTab = tab.id)}>
					{tab.label}
				</button>
			{/each}
		</div>

		{#key activeTab}
			<CodeEditor
				bind:value={code[activeTab]}
				language={activeTab.endsWith('.svelte')
					? 'html'
					: activeTab.endsWith('.css')
						? 'css'
						: 'javascript'}
				theme={editorTheme}
			/>
		{/key}
	{/snippet}

	{#snippet preview(reloadKey)}
		{#await ensureLexerReady() then lexerReady}
			{@const srcdoc = buildSrcdoc(lexerReady)}
			{#key reloadKey}
				<iframe {srcdoc} title="sandbox" sandbox="allow-scripts"></iframe>
			{/key}
		{/await}

		{#if compileErrors.length > 0}
			<div class="compile-errors" role="alert">
				{#each compileErrors as error (error)}
					<pre>{error}</pre>
				{/each}
			</div>
		{/if}
	{/snippet}
</Sandbox>

<style>
	.tabs {
		border-bottom: var(--border-w) solid var(--border);

		button {
			position: relative;
			padding: 0.6rem 1rem;
			font-family: inherit;
			font-size: var(--tab-font-size);
			color: var(--text-muted);
			background: none;
			border: none;
			cursor: pointer;
			transition: color 0.1s;

			&:hover {
				color: var(--text);
			}

			&.active {
				color: var(--text);
			}

			&::after {
				content: '';
				position: absolute;
				bottom: 0;
				left: 0;
				width: 100%;
				height: 2px;
				background: var(--accent);
				opacity: 0;
			}

			&.active::after {
				opacity: 1;
			}
		}
	}

	.compile-errors {
		position: absolute;
		right: 0.5rem;
		bottom: 0.5rem;
		left: 0.5rem;
		max-height: 40%;
		padding: 0.5rem 0.75rem;
		font-family: monospace;
		font-size: 0.8rem;
		color: #e74c3c;
		background: var(--bg);
		border: var(--border-w) solid #e74c3c;
		border-radius: var(--radius);
		white-space: pre-wrap;
		overflow: auto;

		pre {
			margin: 0;
		}
	}
</style>
