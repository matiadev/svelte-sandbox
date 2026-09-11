const SLOTS = ['IMPORTMAP', 'SANDBOX_DATA', 'USER_CSS', 'APP', 'MODULE'] as const;

type SlotName = (typeof SLOTS)[number];

/**
 * Fill an HTML template's `<!--SLOT-->` comment markers.
 * Any slot not provided is replaced with an empty string.
 * Uses split/join (not String.replace) so `$`-sequences in values stay literal.
 */
export function renderDoc(template: string, slots: Partial<Record<SlotName, string>>): string {
	return SLOTS.reduce(
		(content, name) => content.split(`<!--${name}-->`).join(slots[name] ?? ''),
		template
	);
}
