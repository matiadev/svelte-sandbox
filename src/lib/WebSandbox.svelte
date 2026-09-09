<script lang="ts">
	import { untrack } from 'svelte';
	import CodeEditor from './CodeEditor.svelte';
	import { dedentCode } from './dedent.js';
	import { collectScriptImports, ensureLexerReady } from './imports.js';
	import Sandbox from './Sandbox.svelte';
	import Tabs from './Tabs.svelte';
	import { renderDoc } from './preview-doc.js';
	import previewHtml from './preview.html?raw';
	import { language } from './languageMapper.ts';
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
		resizable = true,
		initialSplit = 50,
		minSplit = 20,
		maxSplit = 80
	}: Props = $props();

	let code = $state(dedentCode(untrack(() => initial)));

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
		{const tabs = (
			[
				{ id: 'html', label: 'HTML' },
				{ id: 'css', label: 'CSS' },
				{ id: 'script', label: 'JS' }
			] as const
		).filter((t) => code[t.id] !== '')}
		{let activeTab = $state(tabs[0].id)}
		<Tabs {tabs} bind:active={activeTab} />

		{#key activeTab}
			<CodeEditor bind:value={code[activeTab]} language={language[activeTab]} theme={editorTheme} />
		{/key}
	{/snippet}

	{#snippet preview(reloadKey)}
		{#await ensureLexerReady() then lexerReady}
			{@const srcdoc = buildSrcdoc(lexerReady)}
			{#key reloadKey}
				<iframe {srcdoc} title="sandbox" sandbox="allow-scripts"></iframe>
			{/key}
		{/await}
	{/snippet}
</Sandbox>
