/** Typeface classification flag — used for serif/sans-serif frontend filters */
export const includesSerifField = {
	title: 'Includes Serifs',
	name: 'serif',
	type: 'boolean' as const,
	initialValue: false,
	description: 'Check if this typeface includes serif letterforms. Used for typeface overview serif/sans filters. Frontend automatically treats non-serif typefaces as sans-serif.',
}
