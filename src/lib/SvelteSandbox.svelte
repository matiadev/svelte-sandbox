<script lang="ts">
	import { untrack } from 'svelte';
	import { VERSION } from 'svelte/compiler';
	import CodeEditor from './CodeEditor.svelte';
	import { compileFiles } from './compile.js';
	import { dedent } from './dedent.js';
	import { collectBareImports, ensureLexerReady, isLexerReady } from './imports.js';

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
	}

	const {
		entry = 'App.svelte',
		files: initial,
		width = '100%',
		height = '100%',
		theme,
		editorTheme,
		previewOnly = false,
		classes = ''
	}: Props = $props();

	const filenames = Object.keys(untrack(() => initial));

	let code = $state(
		Object.fromEntries(filenames.map((name) => [name, dedent(untrack(() => initial)[name])]))
	);
	let activeTab = $state(filenames[0] ?? '');
	let reloadKey = $state(0);

	function switchTab(id: string) {
		activeTab = id;
	}

	function reloadPreview() {
		reloadKey++;
	}

	let lexerReady = $state(isLexerReady());

	$effect(() => {
		ensureLexerReady().then((ok) => {
			lexerReady = ok;
		});
	});

	const bareImports = $derived(lexerReady ? collectBareImports(code) : []);

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

	const importmapJson = $derived(
		JSON.stringify(
			{
				imports: Object.assign(
					{
						svelte: `https://esm.sh/svelte@${VERSION}`,
						'svelte/': `https://esm.sh/svelte@${VERSION}/`
					},
					Object.fromEntries(bareImports.map((s) => [s, `https://esm.sh/${s}`]))
				)
			},
			null,
			2
		)
	);

	const sandboxDataJson = $derived(
		JSON.stringify({ files: compiled.js, entry }).replace(/<\//g, '<\\/')
	);

	const script = `
		(async () => {
			const container = document.getElementById('app');
			try {
				const { files: compiled, entry } = JSON.parse(document.getElementById('sandbox-data').textContent);
				const dir = {};

				for (const [name, js] of Object.entries(compiled)) {
					dir[name] = URL.createObjectURL(new Blob([js], { type: 'text/javascript' }));
				}

				for (const [name, url] of Object.entries(dir)) {
					const resp = await fetch(url);
					let text = await resp.text();
					for (const [otherName, otherUrl] of Object.entries(dir)) {
						if (name === otherName) continue;
						text = text.split('"' + './' + otherName + '"').join('"' + otherUrl + '"');
						text = text.split("'./" + otherName + "'").join("'" + otherUrl + "'");
					}
					const updated = new Blob([text], { type: 'text/javascript' });
					dir[name] = URL.createObjectURL(updated);
				}

				const { default: Component } = await import(dir[entry]);
				const { mount } = await import('svelte');
				mount(Component, { target: container });
			} catch (err) {
				container.textContent = 'Error: ' + (err.message ?? err);
				container.style.color = '#e74c3c';
				container.style.padding = '1rem';
				container.style.fontFamily = 'monospace';
				container.style.whiteSpace = 'pre-wrap';
			}
		})();
	`.trim();

	const srcdoc = $derived(`
		<!doctype html>
		<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<script type="importmap">
					${importmapJson}
				<${'/script'}>
				<script id="sandbox-data" type="application/json">
					${sandboxDataJson}
				<${'/script'}>
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
			</head>
			<body>
				<div id="app"></div>
				<script type="module">
					${script}
				<${'/script'}>
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
			</div>
		{/if}

		<div class="preview">
			{#key reloadKey}
				<iframe {srcdoc} title="sandbox" sandbox="allow-scripts"></iframe>
			{/key}
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
	}
</style>
