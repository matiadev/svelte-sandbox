# @sveltecraft/sandbox

Live code sandbox components for Svelte 5 with live preview in a sandboxed iframe and auto-resolved bare imports via [esm.sh](https://esm.sh).

## Installation

```sh
npm i @sveltecraft/sandbox
```

## WebSandbox

An interactive HTML/CSS/JS sandbox with editable source panels and live preview:

```svelte
<script lang="ts">
	import { WebSandbox } from '@sveltecraft/sandbox';
</script>

<WebSandbox
	width={800}
	height={400}
	code={{
		html: '<button>Clicks: 0</button>',
		css: `
			body {
				display: grid;
				place-content: center;
			}
			
			button {
				padding: 1rem 2rem;
				font-size: 1.25rem;
				cursor: pointer;
			}
		`,
		script: `
			import confetti from 'canvas-confetti';
			
			let count = 0;

			document.querySelector('button').addEventListener('click', (e) => {
				count++;
				e.target.textContent = \`Clicks: \${count}\`;
				confetti();
			});
		`
	}}
/>
```

### Props

| Prop          | Type                       | Default  | Description                             |
| ------------- | -------------------------- | -------- | --------------------------------------- |
| `code`        | `{ html?, css?, script? }` | —        | Source code for each panel              |
| `width`       | `string` or `number`       | `'100%'` | Sandbox width (number = px)             |
| `height`      | `string` or `number`       | `'100%'` | Sandbox height (number = px)            |
| `theme`       | `Theme`                    | —        | Container colors and fonts              |
| `editorTheme` | `EditorTheme`              | —        | Editor syntax highlighting colors       |
| `previewOnly` | `boolean`                  | `false`  | Hide the editor, show only the preview  |
| `classes`     | `string`                   | `''`     | Additional CSS classes on the container |

## SvelteSandbox

A multi-file Svelte playground with dynamic file tabs and live preview:

```svelte
<script lang="ts">
	import { SvelteSandbox } from '@sveltecraft/sandbox';
	import { files } from '$lib/examples';
</script>

<SvelteSandbox width={800} height={400} {files} />
```

```ts
export const files = {
	'App.svelte': `
		<script>
			import Button from './Button.svelte';
			let count = $state(0);
		</script>

		<Button onclick={() => count++}>
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
```

> **Note:** Inline template literals with `</script>` or `</style>` won't work directly in a `.svelte` file because the parser closes the tag early. Define your files in a `.ts` file and import them, or use string concatenation (`</scr` + `ipt>`).

### Props

| Prop          | Type                     | Default        | Description                             |
| ------------- | ------------------------ | -------------- | --------------------------------------- |
| `files`       | `Record<string, string>` | —              | Map of filename → source code           |
| `entry`       | `string`                 | `'App.svelte'` | Entry file to mount                     |
| `width`       | `string` or `number`     | `'100%'`       | Sandbox width (number = px)             |
| `height`      | `string` or `number`     | `'100%'`       | Sandbox height (number = px)            |
| `theme`       | `Theme`                  | —              | Container colors and fonts              |
| `editorTheme` | `EditorTheme`            | —              | Editor syntax highlighting colors       |
| `previewOnly` | `boolean`                | `false`        | Hide the editor, show only the preview  |
| `classes`     | `string`                 | `''`           | Additional CSS classes on the container |

## CodeEditor

The underlying CodeMirror 6 editor is also exported if you want to use it standalone:

```svelte
<script lang="ts">
	import { CodeEditor } from '@sveltecraft/sandbox';
</script>

<CodeEditor bind:value={myCode} language="javascript" theme={editorTheme} />
```

## Theming

### Container (`theme`)

| Prop          | Default                               | Description                         |
| ------------- | ------------------------------------- | ----------------------------------- |
| `bg`          | `#1b1e27`                             | Background color                    |
| `border`      | `#29303d`                             | Border color                        |
| `accent`      | `#52ffeb`                             | Accent color (active tab underline) |
| `text`        | `#e4f0fb`                             | Text color                          |
| `textMuted`   | `#c2c7d6`                             | Muted text color (inactive tabs)    |
| `tabFontSize` | `1rem`                                | Tab button font size                |
| `radius`      | `0.5rem`                              | Border radius                       |
| `borderW`     | `1px`                                 | Border width                        |
| `fontFamily`  | `'Atkinson Hyperlegible', sans-serif` | Container font family               |
| `fontSize`    | `1rem`                                | Container font size                 |

### Editor (`editorTheme`)

| Prop         | Default            | Description                                    |
| ------------ | ------------------ | ---------------------------------------------- |
| `accent`     | `#5de4c7`          | Keywords, strings, numbers, tag names          |
| `function`   | `#add7ff`          | Function/variable names, class names           |
| `variable`   | `#e4f0fb`          | Variable names, property names                 |
| `muted`      | `#a6accd`          | Type names, punctuation, operators, attributes |
| `comment`    | `#767c9d`          | Comments                                       |
| `special`    | `#d0679d`          | Booleans, null                                 |
| `text`       | `#fff`             | Editor text color                              |
| `gutter`     | `#767c9d`          | Line number color                              |
| `fontSize`   | `14px`             | Editor font size                               |
| `fontFamily` | `'JetBrains Mono'` | Editor font family                             |

### Example

```svelte
<WebSandbox
	code={{ html: '<h1>Hello</h1>' }}
	theme={{
		bg: '#0f172a',
		accent: '#38bdf8',
		radius: '0.75rem'
	}}
	editorTheme={{
		accent: '#38bdf8',
		function: '#f472b6',
		comment: '#64748b'
	}}
/>
```

## How it works

- **Live preview** — Code is rendered inside a sandboxed iframe via the `srcdoc` attribute with only `allow-scripts`.
- **Import resolution** — Bare specifiers (e.g. `canvas-confetti`) are automatically detected and mapped to [esm.sh](https://esm.sh) via a `<script type="importmap">` injected into the iframe.
- **Svelte compilation** — When using `SvelteSandbox`, components are compiled client-side inside the iframe with support for multi-file imports.
- **Dedent** — Template literals preserve their leading whitespace. The built-in `dedent` utility strips it so you can write clean, indented code blocks without affecting the output.
- **Reactive** — Edits in any panel update the preview in real time. A reload button forces a fresh iframe render when needed.
- **CodeMirror 6** — The editor uses CodeMirror 6 with a Poimandres-inspired dark theme, lazy-loaded to keep initial bundle size small.

## Development

```sh
# Start the preview app
pnpm dev

# Build the library
pnpm build

# Package for publishing
pnpm prepack

# Publish to npm
pnpm publish
```
