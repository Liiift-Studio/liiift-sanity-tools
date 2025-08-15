export const fontTestSchema = {
	name: 'fontTest',
	title: 'Font Test Document',
	type: 'document',
	fields: [
		{
			name: 'name',
			title: 'Font Name',
			type: 'string',
			validation: (Rule: any) => Rule.required(),
		},
		{
			name: 'designer',
			title: 'Designer',
			type: 'string',
		},
		{
			name: 'foundry',
			title: 'Foundry',
			type: 'string',
		},
		{
			name: 'fontFile',
			title: 'Font File',
			type: 'file',
			options: {
				accept: '.otf,.ttf,.woff,.woff2',
			},
		},
		{
			name: 'preview',
			title: 'Preview Image',
			type: 'image',
		},
		{
			name: 'metadata',
			title: 'Font Metadata',
			type: 'object',
			fields: [
				{
					name: 'family',
					title: 'Font Family',
					type: 'string',
				},
				{
					name: 'weight',
					title: 'Font Weight',
					type: 'number',
				},
				{
					name: 'style',
					title: 'Font Style',
					type: 'string',
					options: {
						list: ['normal', 'italic', 'oblique'],
					},
				},
				{
					name: 'version',
					title: 'Version',
					type: 'string',
				},
			],
		},
		{
			name: 'glyphs',
			title: 'Glyphs',
			type: 'array',
			of: [
				{
					type: 'object',
					fields: [
						{
							name: 'unicode',
							title: 'Unicode',
							type: 'string',
						},
						{
							name: 'name',
							title: 'Glyph Name',
							type: 'string',
						},
					],
				},
			],
		},
		{
			name: 'licenseType',
			title: 'License Type',
			type: 'string',
			options: {
				list: [
					{ title: 'Desktop', value: 'desktop' },
					{ title: 'Web', value: 'web' },
					{ title: 'App', value: 'app' },
					{ title: 'Server', value: 'server' },
				],
			},
		},
		{
			name: 'slug',
			title: 'Slug',
			type: 'slug',
			options: {
				source: 'name',
			},
		},
	],
	preview: {
		select: {
			title: 'name',
			designer: 'designer',
			media: 'preview',
		},
		prepare: ({ title, designer, media }: any) => ({
			title,
			subtitle: designer ? `by ${designer}` : 'No designer',
			media,
		}),
	},
};
