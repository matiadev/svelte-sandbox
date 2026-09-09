import { describe, expect, it } from 'vitest';
import { dedent, dedentCode } from './dedent.js';

describe('dedent', () => {
	it('returns empty string for empty input', () => {
		expect(dedent('')).toBe('');
	});

	it('strips common indentation', () => {
		expect(dedent('\n  <h1>hi</h1>\n  <p>yo</p>\n')).toBe('<h1>hi</h1>\n<p>yo</p>');
	});

	it('keeps relative indentation', () => {
		expect(dedent('\n  <div>\n    <span>x</span>\n  </div>\n')).toBe(
			'<div>\n  <span>x</span>\n</div>'
		);
	});

	it('ignores blank lines when computing indent', () => {
		expect(dedent('\n  a\n\n  b\n')).toBe('a\n\nb');
	});
});

describe('dedentCode', () => {
	it('dedents each section and defaults missing to empty', () => {
		expect(dedentCode()).toEqual({ html: '', css: '', script: '' });
		expect(dedentCode({ html: '\n  <h1>x</h1>\n', css: '\n  h1 { color: red; }\n' })).toEqual({
			html: '<h1>x</h1>',
			css: 'h1 { color: red; }',
			script: ''
		});
	});
});
