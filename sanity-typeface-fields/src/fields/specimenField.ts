/** Specimen section — default text and optional paragraph samples (max 3) for the interactive tester */
export const specimenField = {
	title: 'Specimen Section',
	name: 'specimen',
	type: 'object' as const,
	fields: [
		{
			title: 'Initial Text',
			name: 'initial_text',
			description: "Choose a short sentence that you'd like to be the default for this direction before someone types out.",
			type: 'string',
		},
		{
			title: 'Paragraphs',
			name: 'paragraphs',
			description: 'Recommend to include if the typeface has a text face. Include 1–3.',
			type: 'array',
			of: [
				{
					type: 'text',
					rows: 3,
					title: 'Paragraph Text',
					name: 'paragraphText',
				},
			],
			validation: (Rule: any) => Rule.max(3),
		},
	],
}
