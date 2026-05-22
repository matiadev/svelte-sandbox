# @sveltecraft/sandbox

A live code sandbox component for Svelte 5 — edit HTML, CSS, and JavaScript in a CodeMirror 6 editor with a live preview rendered in a sandboxed iframe. Bare imports are auto-resolved via [esm.sh](https://esm.sh).

## Installation

```sh
pnpm add @sveltecraft/sandbox
```

## Usage

```svelte
<script lang="ts">
	import Sandbox from '@sveltecraft/sandbox';
</script>

<Sandbox
	width={800}
	height={400}
	code={{
		html: '<button>Click me</button>',
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
```

## Props

| Prop          | Type                       | Default  | Description                             |
| ------------- | -------------------------- | -------- | --------------------------------------- |
| `code`        | `{ html?, css?, script? }` | —        | Source code for each panel              |
| `width`       | `string` or `number`       | `'100%'` | Sandbox width (number = px)             |
| `height`      | `string` or `number`       | `'100%'` | Sandbox height (number = px)            |
| `theme`       | `Theme`                    | —        | Container colors and fonts              |
| `editorTheme` | `EditorTheme`              | —        | Editor syntax highlighting colors       |
| `previewOnly` | `boolean`                  | `false`  | Hide the editor, show only the preview  |
| `classes`     | `string`                   | `''`     | Additional CSS classes on the container |

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

Example with a custom theme:

```svelte
<Sandbox
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
- **Import resolution** — Bare specifiers in the script panel (e.g. `canvas-confetti`) are automatically detected and mapped to [esm.sh](https://esm.sh) via a `<script type="importmap">` injected into the iframe.
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
