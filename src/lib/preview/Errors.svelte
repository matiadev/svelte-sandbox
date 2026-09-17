<script lang="ts">
	interface Props {
		errors?: string[];
	}

	const { errors = [] }: Props = $props();
</script>

{#if errors.length > 0}
	<div class="compile-errors" role="status">
		{#each errors as error (error)}
			<pre>{error}</pre>
		{/each}
	</div>
{/if}

<style>
	.compile-errors {
		position: absolute;
		right: var(--space-sm);
		bottom: var(--space-sm);
		left: var(--space-sm);
		max-height: 40%;
		padding: var(--space-sm) var(--space-md);
		font-family: monospace;
		font-size: 0.8rem;
		color: var(--error);
		background: var(--bg);
		border: var(--border-w) solid var(--error);
		border-radius: var(--radius);
		white-space: pre-wrap;
		overflow: auto;

		pre {
			margin: 0;
		}
	}
</style>
