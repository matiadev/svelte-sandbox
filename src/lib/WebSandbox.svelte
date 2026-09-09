<script lang="ts">
	import { untrack } from 'svelte';
	import CodeEditor from './CodeEditor.svelte';
	import { dedentCode } from './dedent.js';
	import { collectScriptImports, ensureLexerReady, isLexerReady } from './imports.js';
	import SplitDivider from './SplitDivider.svelte';
	import { SPLIT_BREAKPOINT, clampSplit, nextSplitFromKey, splitFromDragDelta } from './split.js';

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

	type TabId = (typeof tabs)[number]['id'];

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
	let activeTab = $state('html');
	let reloadKey = $state(0);
	// uncontrolled split, intentionally reads props only once
	let split = $state(
		clampSplit(
			untrack(() => initialSplit),
			untrack(() => minSplit),
			untrack(() => maxSplit)
		)
	);
	let stacked = $state(false);
	let dragging = $state(false);
	let containerEl: HTMLDivElement | undefined = $state();
	let sandboxEl: HTMLDivElement | undefined = $state();
	/*
	 * Grab point recorded at drag start.
	 * Moves apply as a delta so a click without dragging never moves the split.
	 */
	let dragStart: { id: number; x: number; y: number; split: number } | null = null;

	function switchTab(id: TabId) {
		activeTab = id;
	}

	function reloadPreview() {
		reloadKey++;
	}

	function updateSplitFromDrag(clientX: number, clientY: number) {
		if (!dragStart) return;
		const rect = (sandboxEl ?? containerEl)?.getBoundingClientRect();
		if (!rect) return;
		split = splitFromDragDelta(
			dragStart.split,
			dragStart.x,
			dragStart.y,
			clientX,
			clientY,
			rect,
			stacked,
			minSplit,
			maxSplit
		);
	}

	function handleDividerPointerDown(event: PointerEvent) {
		if (!resizable || previewOnly) return;
		dragging = true;
		dragStart = { id: event.pointerId, x: event.clientX, y: event.clientY, split };
		try {
			(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
		} catch {
			// noop for synthetic or stale pointer id
		}
		document.body.style.cursor = stacked ? 'row-resize' : 'col-resize';
		document.body.style.userSelect = 'none';
		event.preventDefault();
	}

	function handleDividerPointerMove(event: PointerEvent) {
		if (!dragging || !dragStart || event.pointerId !== dragStart.id) return;
		updateSplitFromDrag(event.clientX, event.clientY);
		event.preventDefault();
	}

	function handleDividerPointerUp(event: PointerEvent) {
		if (!dragging) return;
		dragging = false;
		dragStart = null;
		document.body.style.cursor = '';
		document.body.style.userSelect = '';
		try {
			(event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
		} catch {
			// noop when capture is already released
		}
	}

	function handleDividerKey(event: KeyboardEvent) {
		const next = nextSplitFromKey(split, event.key, event.shiftKey, minSplit, maxSplit);
		if (next !== null) {
			split = next;
			event.preventDefault();
		}
	}

	const tabs = [
		{ id: 'html', label: 'HTML', language: 'html' },
		{ id: 'css', label: 'CSS', language: 'css' },
		{ id: 'script', label: 'JS', language: 'javascript' }
	] as const;

	let lexerReady = $state(isLexerReady());

	$effect(() => {
		ensureLexerReady().then((ok) => {
			lexerReady = ok;
		});
	});

	$effect(() => {
		const el = containerEl;
		if (!el) return;
		const update = () => {
			stacked = el.clientWidth <= SPLIT_BREAKPOINT;
		};
		update();
		const observer = new ResizeObserver(update);
		observer.observe(el);
		return () => observer.disconnect();
	});

	$effect(() => {
		return () => {
			document.body.style.cursor = '';
			document.body.style.userSelect = '';
		};
	});

	const bareImports = $derived(lexerReady ? collectScriptImports(code.script ?? '') : []);

	const importmap = $derived(
		bareImports.length === 0
			? ''
			: JSON.stringify(
					{
						imports: Object.fromEntries(bareImports.map((spec) => [spec, `https://esm.sh/${spec}`]))
					},
					null,
					2
				)
	);

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
				${importmap ? `<script type="importmap">${importmap}<\/script>` : ''}
			</head>
			<body>
				<div class="app">
					${code.html ?? ''}
				</div>
				<script type="module">${code.script ?? ''}<\/script>
			</body>
		</html>
	`);
</script>

<div
	class="sandbox-container {classes}"
	bind:this={containerEl}
	style:width={typeof width === 'number' ? `${width}px` : width}
	style:height={typeof height === 'number' ? `${height}px` : height}
>
	<div
		class="sandbox"
		bind:this={sandboxEl}
		class:preview-only={previewOnly}
		class:dragging
		class:has-divider={resizable && !previewOnly}
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
		style:--split="{split}%"
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
			{#if resizable}
				<SplitDivider
					{stacked}
					{split}
					min={minSplit}
					max={maxSplit}
					{dragging}
					onpointerdown={handleDividerPointerDown}
					onpointermove={handleDividerPointerMove}
					onpointerup={handleDividerPointerUp}
					onpointercancel={handleDividerPointerUp}
					onkeydown={handleDividerKey}
				/>
			{/if}
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

		&.dragging {
			user-select: none;
			-webkit-user-select: none;
		}

		&.dragging .preview :global(iframe) {
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

			:global(iframe) {
				width: 100%;
				height: 100%;
				display: block;
				border: none;
			}

			.preview-only & {
				width: 100%;
				height: 100%;
				flex: 1 1 auto;
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
