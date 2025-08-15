export const bulkTestSchema = {
	name: 'bulkTest',
	title: 'Bulk Operations Test Document',
	type: 'document',
	fields: [
		{
			name: 'title',
			title: 'Title',
			type: 'string',
			validation: (Rule: any) => Rule.required(),
		},
		{
			name: 'content',
			title: 'Content',
			type: 'text',
		},
		{
			name: 'status',
			title: 'Status',
			type: 'string',
			options: {
				list: [
					{ title: 'Draft', value: 'draft' },
					{ title: 'Published', value: 'published' },
					{ title: 'Archived', value: 'archived' },
				],
			},
			initialValue: 'draft',
		},
		{
			name: 'priority',
			title: 'Priority',
			type: 'number',
			validation: (Rule: any) => Rule.min(1).max(10),
			initialValue: 5,
		},
		{
			name: 'category',
			title: 'Category',
			type: 'string',
			options: {
				list: [
					{ title: 'Category 1', value: 'cat1' },
					{ title: 'Category 2', value: 'cat2' },
					{ title: 'Category 3', value: 'cat3' },
					{ title: 'Category 4', value: 'cat4' },
					{ title: 'Category 5', value: 'cat5' },
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
			name: 'metadata',
			title: 'Metadata',
			type: 'object',
			fields: [
				{
					name: 'author',
					title: 'Author',
					type: 'string',
				},
				{
					name: 'version',
					title: 'Version',
					type: 'number',
					initialValue: 1,
				},
				{
					name: 'lastModified',
					title: 'Last Modified',
					type: 'datetime',
				},
			],
		},
		{
			name: 'relatedItems',
			title: 'Related Items',
			type: 'array',
			of: [
				{
					type: 'reference',
					to: [{ type: 'bulkTest' }, { type: 'referenceTest' }],
				},
			],
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
			status: 'status',
			priority: 'priority',
		},
		prepare: ({ title, status, priority }: any) => ({
			title,
			subtitle: `Status: ${status || 'draft'} | Priority: ${priority || 5}`,
		}),
	},
};
