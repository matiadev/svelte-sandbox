<script lang="ts" generics="T extends string">
	interface Props {
		tabs: { id: T; label: string }[];
		active: T;
	}

	let { tabs, active = $bindable() }: Props = $props();
</script>

<div class="tabs">
	{#each tabs as tab (tab.id)}
		<button aria-pressed={active === tab.id} onclick={() => (active = tab.id)}>
			{tab.label}
		</button>
	{/each}
</div>

<style>
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

			&[aria-pressed='true'] {
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

			&[aria-pressed='true']::after {
				opacity: 1;
			}
		}
	}
</style>
