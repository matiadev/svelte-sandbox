<script lang="ts">
	import { untrack } from 'svelte';
	import CodeEditor from './CodeEditor.svelte';
	import { dedentCode } from './dedent.js';
	import { collectScriptImports, ensureLexerReady } from './imports.js';
	import Sandbox from './Sandbox.svelte';
	import Tabs from './Tabs.svelte';
	import { renderDoc } from './preview-doc.js';
	import previewHtml from './preview.html?raw';
	import { language } from './languageMapper.js';
	import type { Code, SharedProps } from './types.js';

	interface Props extends SharedProps {
		code?: Code;
	}

	const {
		code: initial,
		width = '100%',
		height = '100%',
		theme,
		editorTheme,
		previewOnly = false,
		classes = '',
		previewTitle = 'Web preview',
		resizable = true,
		initialSplit = 50,
		minSplit = 20,
		maxSplit = 80
	}: Props = $props();

	let code = $state(dedentCode(untrack(() => initial)));

	const panes = [
		{ id: 'html', label: 'HTML' },
		{ id: 'css', label: 'CSS' },
		{ id: 'script', label: 'JS' }
	] as const;

	type PaneId = (typeof panes)[number]['id'];

	const tabs = $derived(panes.filter((t) => code[t.id] !== ''));

	let activeTab: PaneId = $state(untrack(() => panes.find((t) => code[t.id] !== '')?.id ?? 'html'));

	$effect(() => {
		if (tabs.length > 0 && !tabs.some((t) => t.id === activeTab)) {
			activeTab = tabs[0].id;
		}
	});

	function buildSrcdoc(lexerReady: boolean) {
		const bareImports = lexerReady ? collectScriptImports(code.script ?? '') : [];

		let importmapJSON;

		if (bareImports.length === 0) importmapJSON = '';
		else {
			const imports = Object.fromEntries(
				bareImports.map((spec) => [spec, `https://esm.sh/${spec}`])
			);
			importmapJSON = JSON.stringify({ imports }, null, 2);
		}

		return renderDoc(previewHtml, {
			IMPORTMAP: importmapJSON ? `<script type="importmap">${importmapJSON}<\/script>` : '',
			USER_CSS: `<style>${code.css ?? ''}</style>`,
			APP: `<div class="app">${code.html ?? ''}</div>`,
			MODULE: `<script type="module">${code.script ?? ''}<\/script>`
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
		{#if tabs.length === 0}
			<p class="no-files">No code to edit.</p>
		{:else}
			<Tabs {tabs} bind:active={activeTab} label="Web files" idPrefix="web" />

			{#key activeTab}
				<div
					role="tabpanel"
					id="web-panel-{activeTab}"
					aria-labelledby="web-tab-{activeTab}"
					tabindex="0"
				>
					<CodeEditor
						bind:value={code[activeTab]}
						language={language[activeTab]}
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
</style>
