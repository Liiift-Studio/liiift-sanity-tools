/** Typeface metadata — flat key/value pairs (Designer, Engineer, release dates, etc.) */
export const metadataField = {
	title: 'Metadata',
	name: 'metadata',
	type: 'array' as const,
	of: [
		{
			type: 'object',
			fields: [
				{ name: 'key', type: 'string', title: 'Key' },
				{ name: 'value', type: 'string', title: 'Value' },
			],
		},
	],
	initialValue: [
		{ key: 'Designer', value: '' },
		{ key: 'Engineer', value: '' },
		{ key: 'Current Release', value: '' },
		{ key: 'Initial Release', value: '' },
	],
}
