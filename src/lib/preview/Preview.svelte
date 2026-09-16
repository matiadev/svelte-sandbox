<script lang="ts">
	import { ensureLexerReady, type Collector } from './imports.js';
	import { renderCode, type Slots } from './renderCode.js';
	import previewHtml from './template.html?raw';

	interface Props {
		build: (collector: Collector) => Slots;
		name?: string;
	}

	const { build: buildSlots, name = 'Preview' }: Props = $props();
</script>

{#await ensureLexerReady()}
	<p>Loading preview…</p>
{:then collector}
	{@const srcdoc = renderCode(previewHtml, buildSlots(collector))}
	{let reloadKey = $state(false)}
	{#key reloadKey}
		<iframe {srcdoc} title={name} sandbox="allow-scripts"></iframe>
	{/key}
	<button
		type="button"
		class="reload-button"
		onclick={() => (reloadKey = !reloadKey)}
		aria-label="Reload preview"
	>
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
			aria-hidden="true"
			focusable="false"
		>
			<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
			<path d="M3 3v5h5" />
		</svg>
	</button>
{:catch}
	<p role="alert">Could not load preview.</p>
{/await}

<style>
	iframe {
		width: 100%;
		height: 100%;
		display: block;
		border: none;
	}

	p {
		padding: var(--space-md);
		font-size: 0.9rem;
		color: var(--text-muted);
	}

	.reload-button {
		position: absolute;
		top: var(--space-sm);
		right: var(--space-sm);
		padding: var(--space-xs);
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
			width: var(--icon-size);
			height: var(--icon-size);
			display: block;
		}
	}
</style>
