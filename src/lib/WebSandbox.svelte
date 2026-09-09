<script lang="ts">
	import { untrack } from 'svelte';
	import CodeEditor from './CodeEditor.svelte';
	import { dedentCode } from './dedent.js';
	import { collectScriptImports, ensureLexerReady } from './imports.js';
	import Sandbox from './Sandbox.svelte';

	interface Code {
		html?: string;
		css?: string;
		script?: string;
	}

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
		code?: Code;
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

		return `
		<!doctype html>
		<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<style>
					@layer default {
						*, *::before, *::after {
							box-sizing: border-box;
						}

						body {
							height: 100svh;
							margin: 0;
							font-family: 'Atkinson Hyperlegible', sans-serif;
							color: #fff;
							line-height: 1.5;
							-webkit-font-smoothing: antialiased;
						}

						img, picture, video, canvas, svg {
							max-width: 100%;
							display: block;
						}

						input, button, textarea, select {
							font: inherit;
						}
					}
				</style>
				<style>${code.css ?? ''}</style>
				${importmapJSON ? `<script type="importmap">${importmapJSON}<\/script>` : ''}
			</head>
			<body>
				<div class="app">
					${code.html ?? ''}
				</div>
				<script type="module">${code.script ?? ''}<\/script>
			</body>
		</html>
	`;
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
		{let activeTab = $state('html')}
		{const tabs = [
			{ id: 'html', label: 'HTML', language: 'html' },
			{ id: 'css', label: 'CSS', language: 'css' },
			{ id: 'script', label: 'JS', language: 'javascript' }
		] as const}

		<div class="tabs">
			{#each tabs.filter((t) => code[t.id] !== '') as tab (tab.id)}
				<button class:active={activeTab === tab.id} onclick={() => (activeTab = tab.id)}>
					{tab.label}
				</button>
			{/each}
		</div>
		{#each tabs.filter((t) => code[t.id] !== '') as tab (tab.id)}
			{#if activeTab === tab.id}
				<CodeEditor bind:value={code[tab.id]} language={tab.language} theme={editorTheme} />
			{/if}
		{/each}
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
</style>
