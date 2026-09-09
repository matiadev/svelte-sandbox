<script lang="ts">
	import { untrack } from 'svelte';
	import { VERSION } from 'svelte/compiler';
	import CodeEditor from './CodeEditor.svelte';
	import { compileFiles } from './compile.js';
	import { dedent } from './dedent.js';
	import { collectBareImports, ensureLexerReady } from './imports.js';
	import Sandbox from './Sandbox.svelte';
	import previewHtml from './preview.html?raw';
	import previewRuntime from './preview-runtime.ts?raw';

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

	let code = $state(
		Object.fromEntries(filenames.map((name) => [name, dedent(untrack(() => initial)[name])]))
	);
	let activeTab = $state(filenames[0] ?? '');
	let reloadKey = $state(false);

	function switchTab(id: string) {
		activeTab = id;
	}

	function reloadPreview() {
		reloadKey = !reloadKey;
	}

	const compiled = $derived(compileFiles(code));

	const compileErrors = $derived(
		Object.entries(compiled.errors).map(([file, message]) => `${file}: ${message}`)
	);

	const tabs = $derived(
		filenames.map((name) => ({
			id: name,
			label: name,
			language: name.endsWith('.svelte') ? 'html' : name.endsWith('.css') ? 'css' : 'javascript'
		}))
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
		<div class="tabs">
			{#each tabs as tab (tab.id)}
				<button class:active={activeTab === tab.id} onclick={() => switchTab(tab.id)}>
					{tab.label}
				</button>
			{/each}
		</div>
		{#each tabs as tab (tab.id)}
			{#if activeTab === tab.id}
				<CodeEditor bind:value={code[tab.id]} language={tab.language} theme={editorTheme} />
			{/if}
		{/each}
	{/snippet}

	{#snippet preview()}
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
		<button class="reload-button" onclick={reloadPreview} aria-label="Reload preview">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
				<path d="M3 3v5h5" />
			</svg>
		</button>
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

	.reload-button {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		padding: 0.25rem;
		color: var(--text-muted);
		background: var(--bg);
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius);
		cursor: pointer;
		transition: color 0.1s;

		&:hover {
			color: var(--text);
		}

		svg {
			width: 1.25rem;
			height: 1.25rem;
			display: block;
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
