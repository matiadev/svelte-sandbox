const PREVIEW_KEYS = ['IMPORTMAP', 'SANDBOX_DATA', 'USER_CSS', 'APP', 'MODULE'] as const;

type PreviewKey = (typeof PREVIEW_KEYS)[number];
export type PreviewHTML = Partial<Record<PreviewKey, string>>;

/**
 * Fill an HTML template's `<!--KEY-->` comment markers.
 * Any key not provided is replaced with an empty string.
 * Uses split/join (not String.replace) so `$`-sequences in values stay literal.
 */
export function renderCode(template: string, content: PreviewHTML): string {
	return PREVIEW_KEYS.reduce(
		(html, name) => html.split(`<!--${name}-->`).join(content[name] ?? ''),
		template
	);
}
