/** Typeface release year — stored as a string, defaults to the current year */
export const releaseDateField = {
	title: 'Release Date',
	name: 'releaseDate',
	type: 'string' as const,
	initialValue: String(new Date().getFullYear()),
}
