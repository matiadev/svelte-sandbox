<script lang="ts">
	import { page } from '$app/state';
	import { WebSandbox, SvelteSandbox } from '$lib/index.js';
	import { webCode, svelteFiles } from '../examples/index.js';

	let showSvelte = $state(true);
	let withConfetti = $state(true);

	let clean = $derived(page.url.searchParams.has('clean'));

	const dots = [
		{ x: '6%', y: '12%', c: '#52ffeb', r: '-20deg', w: '10px', h: '14px' },
		{ x: '12%', y: '48%', c: '#d0679d', r: '30deg', w: '8px', h: '12px' },
		{ x: '18%', y: '78%', c: '#ffd166', r: '10deg', w: '9px', h: '13px' },
		{ x: '26%', y: '22%', c: '#5de4c7', r: '-40deg', w: '7px', h: '11px' },
		{ x: '33%', y: '58%', c: '#add7ff', r: '45deg', w: '10px', h: '14px' },
		{ x: '39%', y: '12%', c: '#ff6b6b', r: '-10deg', w: '8px', h: '12px' },
		{ x: '44%', y: '82%', c: '#52ffeb', r: '20deg', w: '11px', h: '15px' },
		{ x: '49%', y: '32%', c: '#d0679d', r: '-30deg', w: '7px', h: '10px' },
		{ x: '54%', y: '68%', c: '#ffd166', r: '55deg', w: '9px', h: '13px' },
		{ x: '59%', y: '16%', c: '#5de4c7', r: '-15deg', w: '10px', h: '14px' },
		{ x: '64%', y: '44%', c: '#add7ff', r: '25deg', w: '8px', h: '12px' },
		{ x: '69%', y: '80%', c: '#ff6b6b', r: '-50deg', w: '9px', h: '13px' },
		{ x: '74%', y: '24%', c: '#52ffeb', r: '35deg', w: '7px', h: '11px' },
		{ x: '79%', y: '60%', c: '#d0679d', r: '-25deg', w: '11px', h: '16px' },
		{ x: '84%', y: '14%', c: '#ffd166', r: '15deg', w: '8px', h: '12px' },
		{ x: '88%', y: '42%', c: '#5de4c7', r: '-35deg', w: '10px', h: '14px' },
		{ x: '92%', y: '72%', c: '#add7ff', r: '40deg', w: '7px', h: '11px' },
		{ x: '8%', y: '88%', c: '#ff6b6b', r: '-5deg', w: '9px', h: '13px' },
		{ x: '95%', y: '88%', c: '#52ffeb', r: '-45deg', w: '8px', h: '12px' },
		{ x: '50%', y: '8%', c: '#ffd166', r: '60deg', w: '9px', h: '13px' }
	];
</script>

<div class="banner-stage" class:clean>
	<div class="banner" class:clean>
		<header>
			<h1>@sveltecraft/sandbox</h1>
			<p>Interactive code sandbox components for Svelte 5</p>
		</header>

		<div class="sandbox-wrap">
			{#if showSvelte}
				<SvelteSandbox height={clean ? 420 : 380} files={svelteFiles} />
			{:else}
				<WebSandbox height={clean ? 420 : 380} code={webCode} />
			{/if}

			{#if withConfetti}
				<div class="confetti" aria-hidden="true">
					{#each dots as dot (dot.x + dot.y)}
						<span
							style:left={dot.x}
							style:top={dot.y}
							style:background={dot.c}
							style:rotate={dot.r}
							style:width={dot.w}
							style:height={dot.h}
						></span>
					{/each}
				</div>
			{/if}
		</div>

		{#if !clean}
			<div class="toolbar">
				<button onclick={() => (showSvelte = !showSvelte)}>Toggle example</button>
				<button onclick={() => (withConfetti = !withConfetti)}>Toggle confetti</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.banner-stage {
		min-height: 100svh;
		display: grid;
		place-items: center;
		padding: 2rem;

		&.clean {
			min-height: auto;
			display: block;
			padding: 0;
			background: #1b1e27;
		}
	}

	.banner {
		width: 1280px;
		max-width: 100%;
		height: 640px;
		display: flex;
		flex-direction: column;
		gap: 2rem;
		padding: 3.5rem 4rem 2rem;
		background: #1b1e27;
		background-image: radial-gradient(ellipse at 50% 0%, oklch(0.8 0.4 180 / 4%), transparent 60%);
		overflow: hidden;
	}

	header {
		text-align: center;

		h1 {
			margin: 0;
			font-size: 3.25rem;
			line-height: 1;
		}

		p {
			margin: 1rem 0 0;
			font-size: 1.35rem;
		}
	}

	.sandbox-wrap {
		position: relative;
		flex: 1;
		min-height: 0;
	}

	.confetti {
		position: absolute;
		inset: 0;
		pointer-events: none;

		span {
			position: absolute;
			border-radius: 2px;
			opacity: 0.9;
		}
	}

	.toolbar {
		display: flex;
		align-items: center;
		gap: 0.75rem;

		button {
			padding: 0.4rem 0.8rem;
			font: inherit;
			font-size: 0.85rem;
			color: #e4f0fb;
			background: #29303d;
			border: 1px solid #3a4356;
			border-radius: 0.4rem;
			cursor: pointer;
		}
	}
</style>
