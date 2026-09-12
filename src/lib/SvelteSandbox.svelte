<script lang="ts">
	import { untrack } from 'svelte';
	import { VERSION } from 'svelte/compiler';
	import CodeEditor from './CodeEditor.svelte';
	import { compileFiles } from './compile.js';
	import { dedent } from './dedent.js';
	import { collectBareImports, ensureLexerReady } from './imports.js';
	import Sandbox from './Sandbox.svelte';
	import Tabs from './Tabs.svelte';
	import { renderDoc } from './preview-doc.js';
	import previewHtml from './preview.html?raw';
	import previewRuntime from './preview-runtime.js?raw';
	import { language } from './languageMapper.js';
	import type { SharedProps } from './types.js';

	interface Props extends SharedProps {
		entry?: string;
		files: Record<string, string>;
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
		previewTitle = 'Svelte preview',
		resizable = true,
		initialSplit = 50,
		minSplit = 20,
		maxSplit = 80
	}: Props = $props();

	const filenames = Object.keys(untrack(() => initial));

	let code = $state(Object.fromEntries(filenames.map((name) => [name, dedent(initial[name])])));

	const compiled = $derived(compileFiles(code));

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
		const error = theme?.error ?? '#e74c3c';
		const sandboxDataJson = JSON.stringify({ files: compiled.js, entry, error }).replace(
			/<\//g,
			'<\\/'
		);

		return renderDoc(previewHtml, {
			IMPORTMAP: `<script type="importmap">${importmapJson}<\/script>`,
			SANDBOX_DATA: `<script id="sandbox-data" type="application/json">${sandboxDataJson}<\/script>`,
			APP: '<div id="app"></div>',
			MODULE: `<script type="module">${previewRuntime}<\/script>`
		});
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
		{const tabs = filenames.map((name) => ({ id: name, label: name }))}
		{let activeTab = $state(filenames[0] ?? '')}
		{#if tabs.length === 0}
			<p class="no-files">No files to edit.</p>
		{:else}
			<Tabs {tabs} bind:active={activeTab} label="Svelte files" idPrefix="svelte" />

			{#key activeTab}
				<div
					role="tabpanel"
					id="svelte-panel-{activeTab}"
					aria-labelledby="svelte-tab-{activeTab}"
					tabindex="0"
				>
					<CodeEditor
						bind:value={code[activeTab]}
						language={language[activeTab.split('.').pop() as keyof typeof language] ?? 'javascript'}
						theme={editorTheme}
					/>
				</div>
			{/key}
		{/if}
	{/snippet}

	{#snippet preview(reloadKey)}
		{#await ensureLexerReady()}
			<p class="preview-loading">Loading preview…</p>
		{:then lexerReady}
			{@const srcdoc = buildSrcdoc(lexerReady)}
			{#key reloadKey}
				<iframe {srcdoc} title={previewTitle} sandbox="allow-scripts"></iframe>
			{/key}
		{:catch}
			<p class="preview-error" role="alert">Could not load preview.</p>
		{/await}

		{const compileErrors = $derived(
			Object.entries(compiled.errors).map(([file, message]) => `${file}: ${message}`)
		)}
		{#if compileErrors.length > 0}
			<div class="compile-errors" role="status">
				{#each compileErrors as error (error)}
					<pre>{error}</pre>
				{/each}
			</div>
		{/if}
	{/snippet}
</Sandbox>

<style>
	[role='tabpanel'] {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.no-files,
	.preview-loading,
	.preview-error {
		padding: var(--space-md);
		font-size: 0.9rem;
		color: var(--text-muted);
	}

	.compile-errors {
		position: absolute;
		right: var(--space-sm);
		bottom: var(--space-sm);
		left: var(--space-sm);
		max-height: 40%;
		padding: var(--space-sm) var(--space-md);
		font-family: monospace;
		font-size: 0.8rem;
		color: var(--error);
		background: var(--bg);
		border: var(--border-w) solid var(--error);
		border-radius: var(--radius);
		white-space: pre-wrap;
		overflow: auto;

		pre {
			margin: 0;
		}
	}
</style>
