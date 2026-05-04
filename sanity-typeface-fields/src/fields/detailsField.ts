/** Visual Details section — array of close-up character images with caption and style label */
export const detailsField = {
	title: 'Visual Details Section',
	name: 'details',
	type: 'array' as const,
	of: [
		{
			title: 'Visual Detail Section',
			name: 'detail',
			type: 'object',
			fields: [
				{
					title: 'Image',
					name: 'image',
					type: 'image',
					description: 'Alt text will be generated automatically from the content in the caption and typeface style.',
				},
				{
					title: 'Caption',
					name: 'caption',
					type: 'string',
					description: 'e.g. "The Number 8", "The Letters ABC", "The Letter Q"',
				},
				{
					title: 'Typeface Style',
					name: 'style',
					type: 'string',
					description: 'e.g. "Owners XXNarrow XLight"',
				},
			],
		},
	],
}
