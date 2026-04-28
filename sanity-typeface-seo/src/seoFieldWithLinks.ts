/** SEO/social field extended with marketplace links — used by Darden Studio (Adobe Fonts, Font Stand) */
export const seoFieldWithLinks = {
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
			title: 'Adobe Fonts Link',
			name: 'adobeLink',
			type: 'string',
			description: 'Link to Adobe Fonts page',
		},
		{
			title: 'Font Stand Link',
			name: 'fontStandLink',
			type: 'string',
			description: 'Link to Font Stand page',
		},
		{
			title: 'Description',
			name: 'description',
			type: 'text',
			description: 'Add a description for the page. If left blank, this will default to the website description.',
		},
	],
}
