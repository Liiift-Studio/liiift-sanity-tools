export const assetTestSchema = {
	name: 'assetTest',
	title: 'Asset Test Document',
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
			name: 'featuredImage',
			title: 'Featured Image',
			type: 'image',
			options: {
				hotspot: true,
			},
		},
		{
			name: 'gallery',
			title: 'Image Gallery',
			type: 'array',
			of: [
				{
					type: 'image',
					options: {
						hotspot: true,
					},
				},
			],
		},
		{
			name: 'documents',
			title: 'Documents',
			type: 'array',
			of: [
				{
					type: 'file',
				},
			],
		},
		{
			name: 'video',
			title: 'Video File',
			type: 'file',
			options: {
				accept: 'video/*',
			},
		},
		{
			name: 'category',
			title: 'Asset Category',
			type: 'string',
			options: {
				list: [
					{ title: 'Images', value: 'images' },
					{ title: 'Documents', value: 'documents' },
					{ title: 'Videos', value: 'videos' },
					{ title: 'Audio', value: 'audio' },
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
			media: 'featuredImage',
		},
		prepare: ({ title, category, media }: any) => ({
			title,
			subtitle: category ? `Category: ${category}` : 'No category',
			media,
		}),
	},
};
