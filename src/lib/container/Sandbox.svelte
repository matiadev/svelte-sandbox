<script lang="ts">
	import { untrack } from 'svelte';
	import CodeEditor from '../editor/CodeEditor.svelte';
	import Divider from './Divider.svelte';
	import Errors from '../preview/Errors.svelte';
	import Preview from '../preview/Preview.svelte';
	import Tabs from '../editor/Tabs.svelte';
	import { Splitter } from './split.svelte.js';
	import type { EditorConfig, PreviewConfig, SandboxConfig, SandboxFile, Theme } from '../types.js';

	interface Props {
		sandbox?: SandboxConfig;
		editor?: EditorConfig;
		code?: SandboxFile[];
		preview: PreviewConfig;
		theme?: Theme;
	}

	const { sandbox = {}, editor = {}, code = $bindable(), preview, theme }: Props = $props();

	const { width = '100%', height = '100%', classes = '', resizable = {} } = $derived(sandbox);
	const splitConfig = $derived(resizable ? resizable : {});
	const editorShown = $derived(editor.enable ?? true);
	const previewShown = $derived(preview.enable ?? true);

	const splitter = new Splitter({
		initial: untrack(() => splitConfig.initial),
		min: () => splitConfig.min,
		max: () => splitConfig.max
	});

	const visibleFiles = $derived((code ?? []).filter((file) => file.content !== ''));
	const activeFile = $derived(visibleFiles.find((file) => file.name === activeTab));

	let activeTab = $state('');

	$effect(() => {
		if (!visibleFiles.some((file) => file.name === activeTab)) {
			activeTab = visibleFiles[0]?.name ?? '';
		}
	});
</script>

<div
	class={['sandbox-container', classes]}
	{@attach splitter.attachContainer}
	style:width={typeof width === 'number' ? `${width}px` : width}
	style:height={typeof height === 'number' ? `${height}px` : height}
>
	<div
		class={[
			'sandbox',
			resizable && editorShown && previewShown && 'has-divider',
			!editorShown && previewShown && 'preview-only',
			editorShown && !previewShown && 'editor-only'
		]}
		data-dragging={splitter.dragging ? 'true' : undefined}
		style:--bg={theme?.bg}
		style:--border={theme?.border}
		style:--accent={theme?.accent}
		style:--text={theme?.text}
		style:--text-muted={theme?.textMuted}
		style:--error={theme?.error}
		style:--radius={theme?.radius}
		style:--tab-font-size={theme?.tabFontSize}
		style:--border-w={theme?.borderW}
		style:--font-family={theme?.fontFamily}
		style:--font-size={theme?.fontSize}
		style:--split="{splitter.split}%"
	>
		{#if editorShown}
			<div class="sidebar">
				{#if visibleFiles.length === 0}
					<p class="no-files">No code to edit.</p>
				{:else}
					{@const tabs = visibleFiles.map((file) => ({
						id: file.name,
						label: file.label ?? file.name
					}))}
					<Tabs {tabs} bind:active={activeTab} label={editor.name ?? 'Files'} idPrefix="sandbox" />

					{#key activeTab}
						<div
							role="tabpanel"
							id="sandbox-panel-{activeTab}"
							aria-labelledby="sandbox-tab-{activeTab}"
							tabindex="0"
						>
							{#if activeFile}
								<CodeEditor
									bind:value={activeFile.content}
									language={activeFile.language}
									theme={editor.theme}
								/>
							{/if}
						</div>
					{/key}
				{/if}
			</div>
		{/if}
		{#if resizable && editorShown && previewShown}
			<Divider {splitter} />
		{/if}

		{#if previewShown}
			<div class="preview">
				<Preview {...preview} />
				<Errors {...preview} />
			</div>
		{/if}
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
		--error: #e74c3c;
		--space-xs: 0.25rem;
		--space-sm: 0.5rem;
		--space-md: 1rem;
		--tab-padding: 0.6rem var(--space-md);
		--tab-underline-w: 2px;
		--icon-size: 1.25rem;
		--tab-font-size: 1rem;
		--radius: 0.5rem;
		--split: 50%;
		--border-w: 1px;
		--font-family: 'Atkinson Hyperlegible', sans-serif;
		--font-size: 1rem;

		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		font-family: var(--font-family);
		font-size: var(--font-size);
		background: var(--bg);
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius);
		overflow: hidden;

		@container (width > 700px) {
			flex-direction: row;
		}

		&[data-dragging] {
			user-select: none;
			-webkit-user-select: none;
		}

		&[data-dragging] .preview :global(.preview-frame) {
			pointer-events: none;
		}

		.sidebar {
			width: 100%;
			height: var(--split);
			flex: 0 0 auto;
			display: flex;
			flex-direction: column;
			background: var(--bg);
			border-bottom: var(--border-w) solid var(--border);
			overflow: hidden;
			min-height: 0;

			@container (width > 700px) {
				width: var(--split);
				height: 100%;
				border-right: var(--border-w) solid var(--border);
				border-bottom: none;
			}
		}

		&.has-divider .sidebar {
			border-bottom: none;

			@container (width > 700px) {
				border-right: none;
			}
		}

		&.editor-only .sidebar {
			width: 100%;
			height: 100%;
			border-bottom: none;

			@container (width > 700px) {
				border-right: none;
			}
		}

		.preview {
			position: relative;
			width: 100%;
			flex: 1 1 0;
			min-height: 0;
			overflow: hidden;

			@container (width > 700px) {
				width: auto;
				height: 100%;
				flex: 1 1 0;
				min-width: 0;
				min-height: auto;
			}

			.preview-only & {
				width: 100%;
				height: 100%;
				flex: 1 1 auto;
			}
		}
	}

	[role='tabpanel'] {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	p.no-files {
		padding: var(--space-md);
		font-size: 0.9rem;
		color: var(--text-muted);
	}
</style>
