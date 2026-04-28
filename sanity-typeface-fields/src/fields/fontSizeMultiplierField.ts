/** Buy section font size scaler — adjusts how large fonts render in the style grid and buy section */
export const fontSizeMultiplierField = {
	title: 'Buy Section Font Size Multiplier',
	name: 'fontSizeMultiplier',
	type: 'number' as const,
	initialValue: 1,
	description: 'Scale the font size in the buy section style grid. Default is 1.0 (100%). Range: 0.5 to 2.0.',
	validation: (Rule: any) => Rule.min(0.5).max(2.0).precision(2),
}
