<script lang="ts">
	import Sandbox from '$lib/Sandbox.svelte';
</script>

<Sandbox
	width={800}
	height={400}
	code={{
		html: `<button>Click</button>`,
		css: `
			body {
				display: grid;
				place-content: center;
			}

			button {
				padding: 1rem 2rem;
				cursor: pointer;
			}
		`,
		script: `
			import confetti from 'canvas-confetti';

			document
				.querySelector('button')
				.addEventListener('click', () => {
					console.log('🎉');
					confetti();
				});
		`
	}}
/>
