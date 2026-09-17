<script lang="ts">
	import { untrack } from 'svelte';
	import Sandbox from '../container/Sandbox.svelte';
	import { dedent } from '../utils/dedent.js';
	import { toSandboxConfig } from '../container/sandboxConfig.js';
	import type { ImportCollector } from '../preview/imports.js';
	import type { PreviewHTML } from '../preview/renderCode.js';
	import type { Code, SandboxConfig, SandboxFile, SharedProps } from '../types.js';

	interface Props extends SharedProps {
		code?: Code;
	}

	const {
		code: initial,
		width,
		height,
		theme,
		editorTheme,
		previewOnly = false,
		classes,
		previewTitle = 'Web preview',
		resizable,
		initialSplit,
		minSplit,
		maxSplit
	}: Props = $props();

	let code: SandboxFile[] = $state(
		untrack(() => [
			{ name: 'html', label: 'HTML', language: 'html', content: dedent(initial?.html ?? '') },
			{ name: 'css', label: 'CSS', language: 'css', content: dedent(initial?.css ?? '') },
			{
				name: 'script',
				label: 'JS',
				language: 'javascript',
				content: dedent(initial?.script ?? '')
			}
		])
	);

	function content(name: string): string {
		return code.find((file) => file.name === name)?.content ?? '';
	}

	function buildPreview(collector: ImportCollector): PreviewHTML {
		const bareImports = collector.scriptImports(content('script'));

		let importmapJSON;

		if (bareImports.length === 0) importmapJSON = '';
		else {
			const imports = Object.fromEntries(
				bareImports.map((spec) => [spec, `https://esm.sh/${spec}`])
			);
			importmapJSON = JSON.stringify({ imports }, null, 2);
		}

		return {
			IMPORTMAP: importmapJSON ? `<script type="importmap">${importmapJSON}<\/script>` : '',
			USER_CSS: `<style>${content('css')}</style>`,
			APP: `<div class="app">${content('html')}</div>`,
			MODULE: `<script type="module">${content('script')}<\/script>`
		};
	}

	const sandbox: SandboxConfig = $derived(
		toSandboxConfig({ width, height, classes, resizable, initialSplit, minSplit, maxSplit })
	);
</script>

<Sandbox
	{theme}
	{sandbox}
	preview={{ name: previewTitle, buildPreview }}
	editor={{ enable: !previewOnly, theme: editorTheme, name: 'Web files' }}
	bind:code
	idPrefix="web"
/>
