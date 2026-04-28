/** Hero section config — controls default letter-spacing as an em value (e.g. -0.04) */
export const heroField = {
	title: 'Hero Section',
	name: 'hero',
	type: 'object' as const,
	fields: [
		{
			title: 'Default Tracking',
			name: 'tracking',
			type: 'number',
			description: 'Returns an em value. e.g. -0.04',
		},
	],
}
