/** Base SEO/social field — title, keywords, cloudinary image, description. Used by all foundries. */
export const seoField = {
	title: 'SEO',
	name: 'social',
	type: 'object' as const,
	options: { collapsible: true, collapsed: true },
	fields: [
		{
			title: 'Title',
			name: 'title',
			type: 'string',
			description: 'This will default to the page title if left blank.',
		},
		{
			title: 'Keywords',
			name: 'keywords',
			type: 'string',
			initialValue: '',
			description: 'An example would be "typography, font, typeface, type, custom font, custom typeface, type foundry, new fonts".',
		},
		{
			title: 'Image',
			name: 'image',
			type: 'cloudinary.asset',
			description: "Please use any slides you would like to replace the default header with. Gif's aren't supported. It's dimensions are wider than they are tall.",
		},
		{
			title: 'Description',
			name: 'description',
			type: 'text',
			description: 'Add a description for the page. If left blank, this will default to the website description.',
		},
	],
}
