<script lang="ts">
	import { untrack } from 'svelte';
	import CodeEditor from './CodeEditor.svelte';
	import { dedentCode } from './dedent.js';

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
	}

	type TabId = (typeof tabs)[number]['id'];

	const {
		code: initial,
		width = '100%',
		height = '100%',
		theme,
		editorTheme,
		previewOnly = false,
		classes = ''
	}: Props = $props();
	let code = $state(dedentCode(untrack(() => initial)));
	let activeTab = $state('html');
	let reloadKey = $state(0);

	function switchTab(id: TabId) {
		activeTab = id;
	}

	function reloadPreview() {
		reloadKey++;
	}

	const tabs = [
		{ id: 'html', label: 'HTML', language: 'html' },
		{ id: 'css', label: 'CSS', language: 'css' },
		{ id: 'script', label: 'JS', language: 'javascript' }
	] as const;

	const bareImports = $derived.by(() => {
		const matches = (code.script ?? '').matchAll(/(?:from|import)\s*['"](\S+?)['"]/g);
		const specs = [...matches].map((m) => m[1]);
		return [...new Set(specs)].filter(
			(s) => !s.startsWith('.') && !s.startsWith('/') && !s.startsWith('http')
		);
	});

	const importmap = $derived.by(() => {
		if (bareImports.length === 0) return '';
		const imports = Object.fromEntries(bareImports.map((spec) => [spec, `https://esm.sh/${spec}`]));
		return JSON.stringify({ imports }, null, 2);
	});

	const srcdoc = $derived(`
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
				${importmap ? `<script type="importmap">${importmap}<${'/script'}>` : ''}
			</head>
			<body>
				<div class="app">
					${code.html ?? ''}
				</div>
				<script type="module">${code.script ?? ''}<${'/script'}>
			</body>
		</html>
	`);
</script>

<div
	class="sandbox-container {classes}"
	style:width={typeof width === 'number' ? `${width}px` : width}
	style:height={typeof height === 'number' ? `${height}px` : height}
>
	<div
		class="sandbox"
		class:preview-only={previewOnly}
		style:--bg={theme?.bg}
		style:--border={theme?.border}
		style:--accent={theme?.accent}
		style:--text={theme?.text}
		style:--text-muted={theme?.textMuted}
		style:--radius={theme?.radius}
		style:--tab-font-size={theme?.tabFontSize}
		style:--border-w={theme?.borderW}
		style:--font-family={theme?.fontFamily}
		style:--font-size={theme?.fontSize}
	>
		{#if !previewOnly}
			<div class="sidebar">
				<div class="tabs">
					{#each tabs.filter((t) => code[t.id] !== '') as tab (tab.id)}
						<button class:active={activeTab === tab.id} onclick={() => switchTab(tab.id)}>
							{tab.label}
						</button>
					{/each}
				</div>
				{#each tabs.filter((t) => code[t.id] !== '') as tab (tab.id)}
					{#if activeTab === tab.id}
						<CodeEditor bind:value={code[tab.id]} language={tab.language} theme={editorTheme} />
					{/if}
				{/each}
			</div>
		{/if}

		<div class="preview">
			{#key reloadKey}
				<iframe {srcdoc} title="sandbox" sandbox="allow-scripts"></iframe>
			{/key}
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
		</div>
	</div>
</div>

<style>
	.sandbox-container {
		container-type: inline-size;
	}

	.sandbox,
	.sandbox > * {
		box-sizing: border-box;
	}

	.sandbox {
		--bg: #1b1e27;
		--border: #29303d;
		--accent: #52ffeb;
		--text-muted: #c2c7d6;
		--text: #e4f0fb;
		--tab-font-size: 1rem;
		--radius: 0.5rem;
		--panel-ratio: 50%;
		--border-w: 1px;
		--font-family: 'Atkinson Hyperlegible', sans-serif;
		--font-size: 1rem;

		width: 100%;
		height: 100%;
		display: flex;
		flex-wrap: wrap;
		font-family: var(--font-family);
		font-size: var(--font-size);
		background: var(--bg);
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius);
		overflow: hidden;

		.sidebar {
			width: 100%;
			display: flex;
			flex-direction: column;
			background: var(--bg);
			border-bottom: var(--border-w) solid var(--border);
			min-height: 50%;
			max-height: 50%;
			overflow: hidden;

			@container (width > 700px) {
				width: var(--panel-ratio);
				border-right: var(--border-w) solid var(--border);
				border-bottom: none;
				min-height: auto;
				max-height: 100%;
			}
		}

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

		.preview {
			position: relative;
			width: 100%;
			min-height: 50%;
			max-height: 50%;
			overflow: hidden;

			@container (width > 700px) {
				width: var(--panel-ratio);
				min-height: auto;
				max-height: 100%;
			}

			:global(iframe) {
				width: 100%;
				height: 100%;
				display: block;
				border: none;
			}

			.preview-only & {
				width: 100%;
				height: 100%;
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
	}
</style>
