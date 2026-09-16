<script lang="ts">
	import { untrack } from 'svelte';
	import { VERSION } from 'svelte/compiler';
	import { compileFiles } from './compileFiles.ts';
	import { dedent } from '../utils/dedent.ts';
	import type { Collector } from '../preview/imports.ts';
	import Sandbox from '../container/Sandbox.svelte';
	import type { Slots } from '../preview/renderCode.ts';
	import previewRuntime from '../preview/runtime.js?raw';
	import { language } from '../editor/languageMapper.ts';
	import type { SandboxFile, SharedProps } from '../types.ts';

	interface Props extends SharedProps {
		entry?: string;
		files: Record<string, string>;
	}

	const { entry = 'App.svelte', files: initial, sandbox, editor, preview, theme }: Props = $props();

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

	function buildSlots(collect: Collector): Slots {
		const bareImports = collect.bareImports(files);
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
</script>

<Sandbox
	{theme}
	{sandbox}
	preview={{ ...preview, name: 'Svelte preview', build: buildSlots, errors }}
	editor={{ ...editor, name: 'Svelte files' }}
	bind:code
/>
