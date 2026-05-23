<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<svelte:head>
	<title>Svelte Sandbox</title>
</svelte:head>

{@render children()}
