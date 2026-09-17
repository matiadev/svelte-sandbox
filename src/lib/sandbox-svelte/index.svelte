<script lang="ts">
	import { untrack } from 'svelte';
	import { VERSION } from 'svelte/compiler';
	import Sandbox from '../container/Sandbox.svelte';
	import { compileFiles } from './compileFiles.js';
	import { dedent } from '../utils/dedent.js';
	import { language } from '../editor/languageMapper.js';
	import { toSandboxConfig } from '../container/sandboxConfig.js';
	import previewRuntime from '../preview/runtime.js?raw';
	import type { ImportCollector } from '../preview/imports.js';
	import type { PreviewHTML } from '../preview/renderCode.js';
	import type { SandboxConfig, SandboxFile, SharedProps } from '../types.js';

	interface Props extends SharedProps {
		entry?: string;
		files: Record<string, string>;
	}

	const {
		entry = 'App.svelte',
		files: initial,
		width,
		height,
		theme,
		editorTheme,
		previewOnly = false,
		classes,
		previewTitle = 'Svelte preview',
		resizable,
		initialSplit,
		minSplit,
		maxSplit
	}: Props = $props();

	let code: SandboxFile[] = $state(
		untrack(() =>
			Object.entries(initial).map<SandboxFile>(([name, content]) => ({
				name,
				language: language[name.split('.').pop() as keyof typeof language] ?? 'javascript',
				content: dedent(content)
			}))
		)
	);

	const files = $derived(Object.fromEntries(code.map((file) => [file.name, file.content])));
	const compiled = $derived(compileFiles(files));
	const errors = $derived(
		Object.entries(compiled.errors).map(([file, message]) => `${file}: ${message}`)
	);

	function buildPreview(collector: ImportCollector): PreviewHTML {
		const bareImports = collector.bareImports(files);
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

		return {
			IMPORTMAP: `<script type="importmap">${importmapJson}<\/script>`,
			SANDBOX_DATA: `<script id="sandbox-data" type="application/json">${sandboxDataJson}<\/script>`,
			APP: '<div id="app"></div>',
			MODULE: `<script type="module">${previewRuntime}<\/script>`
		};
	}

	const sandbox: SandboxConfig = $derived(
		toSandboxConfig({ width, height, classes, resizable, initialSplit, minSplit, maxSplit })
	);
</script>

<Sandbox
	{theme}
	{sandbox}
	preview={{ name: previewTitle, buildPreview, errors }}
	editor={{ enable: !previewOnly, theme: editorTheme, name: 'Svelte files' }}
	bind:code
/>
