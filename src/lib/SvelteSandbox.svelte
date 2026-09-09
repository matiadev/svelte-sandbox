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
	import { language } from './languageMapper.ts';
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
		const sandboxDataJson = JSON.stringify({ files: compiled.js, entry }).replace(/<\//g, '<\\/');

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
		{const tabs = $derived(filenames.map((name) => ({ id: name, label: name })))}
		{let activeTab = $state(filenames[0] ?? '')}
		<Tabs {tabs} bind:active={activeTab} />

		{#key activeTab}
			<CodeEditor
				bind:value={code[activeTab]}
				language={language[activeTab.split('.').pop() as keyof typeof language]}
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

		{const compileErrors = $derived(
			Object.entries(compiled.errors).map(([file, message]) => `${file}: ${message}`)
		)}
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
