<script lang="ts">
	import { WebSandbox, SvelteSandbox } from '$lib/index.js';
	import { webCode, svelteFiles } from './examples/index.js';
</script>

<div class="page">
	<header>
		<h1>@sveltecraft/sandbox</h1>
		<p>Interactive code sandbox components for Svelte 5</p>
	</header>

	<section>
		<h2>Web Sandbox</h2>
		<WebSandbox height={400} code={webCode} />
	</section>

	<section>
		<h2>Svelte Sandbox</h2>
		<SvelteSandbox height={400} files={svelteFiles} />
	</section>
</div>
