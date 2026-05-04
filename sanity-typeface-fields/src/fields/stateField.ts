/** Typeface publish state field — use createStateField() factory; MCKL passes publishedValue: 'active' */
export const createStateField = ({
	publishedValue = 'published',
	publishedTitle = 'Published ✅',
}: {
	publishedValue?: string
	publishedTitle?: string
} = {}) => ({
	title: 'State',
	name: 'state',
	type: 'string' as const,
	options: {
		list: [
			{ title: 'Draft 🟡', value: 'draft' },
			{ title: publishedTitle, value: publishedValue },
			{ title: 'Hidden 👻', value: 'hidden' },
			{ title: 'Archived 📂', value: 'archived' },
		],
	},
	initialValue: 'draft',
	validation: (Rule: any) => Rule.required(),
})
