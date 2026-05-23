export const svelteFiles = {
	'App.svelte': `
		<script>
			import confetti from 'canvas-confetti';
			import Button from './Button.svelte';

			let count = $state(0);

			function onclick() {
				confetti();
				count++;
			}
		</script>

		<Button {onclick}>
			Clicks: {count}
		</Button>

		<style>
			:global {
				body {
					display: grid;
					place-content: center;
				}
			}
		</style>
	`,
	'Button.svelte': `
		<script>
			let { children, onclick } = $props();
		</script>

		<button {onclick}>
			{@render children?.()}
		</button>

		<style>
			button {
				padding: 1rem 2rem;
				font-size: 1.25rem;
				cursor: pointer;
			}
		</style>
	`
};
