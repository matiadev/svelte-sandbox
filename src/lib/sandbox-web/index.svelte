<script lang="ts">
	import { untrack } from 'svelte';
	import { dedent } from '../utils/dedent.ts';
	import { type Collector } from '../preview/imports.ts';
	import Sandbox from '../container/Sandbox.svelte';
	import type { Slots } from '../preview/renderCode.ts';
	import type { Code, SandboxFile, SharedProps } from '../types.ts';

	interface Props extends SharedProps {
		code?: Code;
	}

	const { code: initial, sandbox, editor, preview, theme }: Props = $props();

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

	function buildSlots(collector: Collector): Slots {
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
</script>

<Sandbox
	{theme}
	{sandbox}
	preview={{ ...preview, name: 'Web preview', build: buildSlots }}
	editor={{ ...editor, name: 'Web files' }}
	bind:code
/>
