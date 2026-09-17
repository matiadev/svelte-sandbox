import { beforeAll, describe, expect, it } from 'vitest';
import { collectBareImports, collectScriptImports, ensureLexerReady } from './imports.js';

beforeAll(async () => {
	await ensureLexerReady();
});

describe('collectScriptImports', () => {
	it('collects bare imports', () => {
		expect(collectScriptImports(`import _ from 'lodash';`)).toEqual(['lodash']);
	});

	it('ignores relative, absolute and http imports', () => {
		const source = [
			`import a from './local.js';`,
			`import b from '/abs.js';`,
			`import c from 'https://example.com/x.js';`,
			`import d from 'lodash';`
		].join('\n');

		expect(collectScriptImports(source)).toEqual(['lodash']);
	});

	it('dedupes specifiers', () => {
		expect(collectScriptImports(`import a from 'lodash';\nimport b from 'lodash';`)).toEqual([
			'lodash'
		]);
	});
});

describe('collectBareImports', () => {
	it('collects from .svelte scripts and plain scripts', () => {
		const files = {
			'App.svelte': `<script>import _ from 'lodash';</script><h1>hi</h1>`,
			'util.js': `import { z } from 'zod';`
		};

		expect(collectBareImports(files).sort()).toEqual(['lodash', 'zod']);
	});

	it('excludes svelte itself', () => {
		const files = {
			'App.svelte': `<script>import { onMount } from 'svelte';\nimport _ from 'lodash';</script>`
		};

		expect(collectBareImports(files)).toEqual(['lodash']);
	});

	it('ignores imports in markup and comments', () => {
		const files = {
			'App.svelte': `<h1>import x from 'not-an-import'</h1>\n<!-- import y from 'nope' -->`
		};

		expect(collectBareImports(files)).toEqual([]);
	});
});
