export const referenceTestSchema = {
	name: 'referenceTest',
	title: 'Reference Test Document',
	type: 'document',
	fields: [
		{
			name: 'title',
			title: 'Title',
			type: 'string',
			validation: (Rule: any) => Rule.required(),
		},
		{
			name: 'description',
			title: 'Description',
			type: 'text',
		},
		{
			name: 'relatedItems',
			title: 'Related Items (Advanced Reference Array Test)',
			type: 'array',
			of: [
				{
					type: 'reference',
					to: [{ type: 'referenceTest' }, { type: 'fontTest' }, { type: 'assetTest' }, { type: 'bulkTest' }],
				},
			],
		},
		{
			name: 'singleReference',
			title: 'Single Reference',
			type: 'reference',
			to: [{ type: 'referenceTest' }, { type: 'fontTest' }],
		},
		{
			name: 'category',
			title: 'Category',
			type: 'string',
			options: {
				list: [
					{ title: 'Test Category A', value: 'category-a' },
					{ title: 'Test Category B', value: 'category-b' },
					{ title: 'Test Category C', value: 'category-c' },
				],
			},
		},
		{
			name: 'tags',
			title: 'Tags',
			type: 'array',
			of: [{ type: 'string' }],
		},
		{
			name: 'publishedAt',
			title: 'Published At',
			type: 'datetime',
		},
		{
			name: 'slug',
			title: 'Slug',
			type: 'slug',
			options: {
				source: 'title',
			},
		},
	],
	preview: {
		select: {
			title: 'title',
			category: 'category',
		},
		prepare: ({ title, category }: any) => ({
			title,
			subtitle: category ? `Category: ${category}` : 'No category',
		}),
	},
};
