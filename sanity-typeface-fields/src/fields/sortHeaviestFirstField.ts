/** Display order preference for font weights in the typeface page */
export const sortHeaviestFirstField = {
	title: 'Sort Fonts Heaviest to Lightest',
	name: 'sortHeaviestFirst',
	type: 'boolean' as const,
	initialValue: false,
	description: 'Sort fonts by weight from heaviest (900) to lightest (100). Default is lightest to heaviest (industry standard).',
}
