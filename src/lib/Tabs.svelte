<script lang="ts" generics="T extends string">
	interface Props {
		tabs: { id: T; label: string }[];
		active: T;
		label?: string;
		idPrefix?: string;
	}

	let { tabs, active = $bindable(), label = 'Files', idPrefix = 'sandbox' }: Props = $props();

	function tabId(id: T): string {
		return `${idPrefix}-tab-${id}`;
	}

	function panelId(id: T): string {
		return `${idPrefix}-panel-${id}`;
	}

	function select(id: T): void {
		active = id;
	}

	function handleKeyDown(event: KeyboardEvent): void {
		const index = tabs.findIndex((tab) => tab.id === active);
		if (index < 0 || tabs.length === 0) return;

		let next: number | null = null;
		if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
		else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
		else if (event.key === 'Home') next = 0;
		else if (event.key === 'End') next = tabs.length - 1;

		if (next !== null) {
			event.preventDefault();
			active = tabs[next].id;
			document.getElementById(tabId(active))?.focus();
		}
	}
</script>

<div class="tabs" role="tablist" aria-label={label}>
	{#each tabs as tab (tab.id)}
		{@const selected = active === tab.id}
		<button
			type="button"
			role="tab"
			id={tabId(tab.id)}
			aria-selected={selected}
			aria-controls={panelId(tab.id)}
			tabindex={selected ? 0 : -1}
			onclick={() => select(tab.id)}
			onkeydown={handleKeyDown}
		>
			{tab.label}
		</button>
	{/each}
</div>

<style>
	.tabs {
		border-bottom: var(--border-w) solid var(--border);

		button {
			position: relative;
			padding: var(--tab-padding);
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

			&[aria-selected='true'] {
				color: var(--text);
			}

			&::after {
				content: '';
				position: absolute;
				bottom: 0;
				left: 0;
				width: 100%;
				height: var(--tab-underline-w);
				background: var(--accent);
				opacity: 0;
			}

			&[aria-selected='true']::after {
				opacity: 1;
			}
		}
	}
</style>
