// Sanity schema field definition for the Stylistic Features section — featured words and full feature set
import { StringIcon } from '@sanity/icons';

export const stylisticSetField = {
	title: 'Stylistic Features Section', 
	name: 'stylisticSet',
	group: 'stylisticSets',
	type: 'object',
	fields: [
		{
			name:'featured',
			title: 'Featured Stylistic Feature Words & Phrases',
			description: 'Write a single letter, word or several words. Wrap the portion of the word that you want to use the stylistic set in ` characters. For example, writing "L`if`t" will make the "if" apply a stylistic set.',
			type:'array',
			of: [
				{
					name:'featuredWord',
					title: 'Words or Phrase',
					type:'object',
					icon: StringIcon,
					fields: [
					{
						type: 'text',
						title: 'Content',
						name: 'content'
					},
					{
						type: 'string',
						title: 'Label',
						name: 'label'
					},
					
					{
						title: "Stylistic Feature",
						name: "stylisticFeature",
						type: "string",
						// description: '[This will be autopopulated with the list of stylistic features when ready.]',
						options: {
							list: [
								{ title: "All Alternates", value: "'aalt' 1" },
								{ title: "All Caps", value: "'c2sc' 1" },
								{ title: "Alternate Annotation", value: "'nalt' 1" },
								{ title: "Alternative Fractions", value: "'afrc' 1" },
								{ title: "Capitals To Small Caps", value: "'c2sc' 1, 'smcp' 1" },
								{ title: "Capitals to Petite Caps", value: "'c2pc' 1" },
								{ title: "Case Sensitive Forms", value: "'case' 1" },
								{ title: "Contextual Alternates", value: "'calt' 1" },
								{ title: "Contextual Ligatures", value: "'clig' 1" },
								{ title: "Contextual Swash", value: "'cswh' 1" },
								{ title: "Denominator", value: "'dnom' 1" },
								{ title: "Discretionary Ligatures", value: "'dlig' 1" },
								{ title: "Fractions", value: "'frac' 1" },
								{ title: "Glyph Decomposition", value: "'ccmp' 1" },
								{ title: "Historical Forms", value: "'hist' 1" },
								{ title: "Historical Ligatures", value: "'hlig' 1" },
								{ title: "Initial Form", value: "'init' 1" },
								{ title: "Isolated Form", value: "'isol' 1" },
								{ title: "Justified Alternates", value: "'jalt' 1" },
								{ title: "Localized Forms", value: "'locl' 1" },
								{ title: "Mark Positioning", value: "'mark' 1" },
								{ title: "Mark Positioning via Subs", value: "'mset' 1" },
								{ title: "Mark to Mark Positioning", value: "'mkmk' 1" },
								{ title: "Mathematical Greek", value: "'mgrk' 1" },
								{ title: "Medial Form", value: "'medi' 1" },
								{ title: "Numerator", value: "'numr' 1" },
								{ title: "Ordinals", value: "'ordn' 1" },
								{ title: "Ornaments", value: "'ornm' 1" },
								{ title: "Petite Caps", value: "'pcap' 1" },
								{ title: "Proportional Lining", value: "'pnum' 1" },
								{ title: "Proportional Oldstyle", value: "'onum' 1" },
								{ title: "Required Ligatures", value: "'rlig' 1" },
								{ title: "Scientific Inferiors", value: "'sinf' 1" },
								{ title: "Slashed Zero", value: "'zero' 1" },
								{ title: "Small Caps", value: "'smcp' 1" },
								{ title: "Standard Ligatures", value: "'liga' 1" },
								{ title: "Stylistic Alternates", value: "'salt' 1" },
								{ title: "Subscript", value: "'subs' 1" },
								{ title: "Superscript", value: "'sups' 1" },
								{ title: "Swash", value: "'swsh' 1" },
								{ title: "Tabular Lining", value: "'tnum' 1" },
								{ title: "Tabular Oldstyle", value: "'onum' 1" },
								{ title: "Terminal Form", value: "'fina' 1" },
								{ title: "Titling Alternates", value: "'titl' 1" },
								{ title: "Unicase", value: "'unic' 1" },
								{ title: "All Stylistic Sets", value: "'ss01' 1, 'ss02' 1, 'ss03' 1, 'ss04' 1, 'ss05' 1, 'ss06' 1, 'ss07' 1, 'ss08' 1, 'ss09' 1, 'ss10' 1, 'ss11' 1, 'ss12' 1, 'ss13' 1, 'ss14' 1, 'ss15' 1, 'ss16' 1, 'ss17' 1, 'ss18' 1, 'ss19' 1, 'ss20' 1" },
								{ title: "Stylistic Set 1", value: "'ss01' 1" },
								{ title: "Stylistic Set 2", value: "'ss02' 1" },
								{ title: "Stylistic Set 3", value: "'ss03' 1" },
								{ title: "Stylistic Set 4", value: "'ss04' 1" },
								{ title: "Stylistic Set 5", value: "'ss05' 1" },
								{ title: "Stylistic Set 6", value: "'ss06' 1" },
								{ title: "Stylistic Set 7", value: "'ss07' 1" },
								{ title: "Stylistic Set 8", value: "'ss08' 1" },
								{ title: "Stylistic Set 9", value: "'ss09' 1" },
								{ title: "Stylistic Set 10", value: "'ss10' 1" },
								{ title: "Stylistic Set 11", value: "'ss11' 1" },
								{ title: "Stylistic Set 12", value: "'ss12' 1" },
								{ title: "Stylistic Set 13", value: "'ss13' 1" },
								{ title: "Stylistic Set 14", value: "'ss14' 1" },
								{ title: "Stylistic Set 15", value: "'ss15' 1" },
								{ title: "Stylistic Set 16", value: "'ss16' 1" },
								{ title: "Stylistic Set 17", value: "'ss17' 1" },
								{ title: "Stylistic Set 18", value: "'ss18' 1" },
								{ title: "Stylistic Set 19", value: "'ss19' 1" },
								{ title: "Stylistic Set 20", value: "'ss20' 1" }
							]
						}
					},
					{
						type: 'string',
						title: 'Specialty CSS Implementation (for multi OT feautes)',
						name: 'specialtyCss',
						placeholder: "'c2sc' 1, 'ss02' 1"
					},
					{
						type: 'boolean',
						title: 'Disable Ligatures on default',
						name: 'ligatures',
					},
					{
						type: 'boolean',
						title: 'Disable Contextual Alternates on default',
						name: 'calt',
					},
					{
						type: 'boolean',
						title: 'Only Applies to Italics',
						name: 'italics',
					},
					{
						title: "Font Size",
						name: "size",
						type: "string",
						description: 'Recommendation: Use "XLarge" for single glyphs; \nuse "Large" for 2–5 glyphs on one line, or 2 short lines of text; use "Medium" for 2–3 lines of text; use "Small" for 3–4 lines of text.',
						options: {
							list: [
								{ title: "XLarge", value: "xl", description: "Recommended for single glyphs." },
								{ title: "Large", value: "lg", description: "Recommended for 2–5 glyphs on one line, or 2 short lines of text." },
								{ title: "Medium", value: "md", description: "Recommended for 2–3 lines of text." },
								{ title: "Small", value: "sm", description: "Recommended for 3–4 lines of text." }
							],
							layout: "radio",
							// direction: "horizontal"
						}
					},
					],
					preview: {
					select: {
						title: 'content',
						subtitle: 'label'
					},
					prepare(selection) {
						const {title, subtitle} = selection;
						return {
							title: title,
							subtitle: subtitle
						};
					}
					}
				}
			]
			},
		{
		name: 'sets',
		title: 'Full list of stylistic features & their corresponding glyphs',
		type: 'array',
		of: [
			{
				name: 'set',
				type: 'object',
				title: 'Stylistic Feature',
				icon: StringIcon,
				fields: [
				{
					name: 'title',
					title: 'Label for Stylistic Feature',
					description: 'e.g. "ss01", "Lining Numerals',
					type: 'string'
				},
				{
					name: 'content',
					title: 'Corresponding glyphs',
					type: 'text',
					description: 'For stylistic features that apply to multiple of the same base character, recommended to create a new line for each base character.'
				},
				{
					title: "Stylistic Feature",
					name: "stylisticFeature",
					type: "string",
					// description: '[This will be autopopulated with the list of stylistic features when ready.]',
					options: {
						list: [
							{ title: "All Alternates", value: "'aalt' 1" },
							{ title: "All Caps", value: "'c2sc' 1" },
							{ title: "Alternate Annotation", value: "'nalt' 1" },
							{ title: "Alternative Fractions", value: "'afrc' 1" },
							{ title: "Capitals To Small Caps", value: "'c2sc' 1, 'smcp' 1" },
							{ title: "Capitals to Petite Caps", value: "'c2pc' 1" },
							{ title: "Case Sensitive Forms", value: "'case' 1" },
							{ title: "Contextual Alternates", value: "'calt' 1" },
							{ title: "Contextual Ligatures", value: "'clig' 1" },
							{ title: "Contextual Swash", value: "'cswh' 1" },
							{ title: "Denominator", value: "'dnom' 1" },
							{ title: "Discretionary Ligatures", value: "'dlig' 1" },
							{ title: "Fractions", value: "'frac' 1" },
							{ title: "Glyph Decomposition", value: "'ccmp' 1" },
							{ title: "Historical Forms", value: "'hist' 1" },
							{ title: "Historical Ligatures", value: "'hlig' 1" },
							{ title: "Initial Form", value: "'init' 1" },
							{ title: "Isolated Form", value: "'isol' 1" },
							{ title: "Justified Alternates", value: "'jalt' 1" },
							{ title: "Localized Forms", value: "'locl' 1" },
							{ title: "Mark Positioning", value: "'mark' 1" },
							{ title: "Mark Positioning via Subs", value: "'mset' 1" },
							{ title: "Mark to Mark Positioning", value: "'mkmk' 1" },
							{ title: "Mathematical Greek", value: "'mgrk' 1" },
							{ title: "Medial Form", value: "'medi' 1" },
							{ title: "Numerator", value: "'numr' 1" },
							{ title: "Ordinals", value: "'ordn' 1" },
							{ title: "Ornaments", value: "'ornm' 1" },
							{ title: "Petite Caps", value: "'pcap' 1" },
							{ title: "Proportional Lining", value: "'pnum' 1" },
							{ title: "Proportional Oldstyle", value: "'onum' 1" },
							{ title: "Required Ligatures", value: "'rlig' 1" },
							{ title: "Scientific Inferiors", value: "'sinf' 1" },
							{ title: "Slashed Zero", value: "'zero' 1" },
							{ title: "Small Caps", value: "'smcp' 1" },
							{ title: "Standard Ligatures", value: "'liga' 1" },
							{ title: "Stylistic Alternates", value: "'salt' 1" },
							{ title: "Subscript", value: "'subs' 1" },
							{ title: "Superscript", value: "'sups' 1" },
							{ title: "Swash", value: "'swsh' 1" },
							{ title: "Tabular Lining", value: "'tnum' 1" },
							{ title: "Tabular Oldstyle", value: "'onum' 1" },
							{ title: "Terminal Form", value: "'fina' 1" },
							{ title: "Titling Alternates", value: "'titl' 1" },
							{ title: "Unicase", value: "'unic' 1" },
							{ title: "All Stylistic Sets", value: "'ss01' 1, 'ss02' 1, 'ss03' 1, 'ss04' 1, 'ss05' 1, 'ss06' 1, 'ss07' 1, 'ss08' 1, 'ss09' 1, 'ss10' 1, 'ss11' 1, 'ss12' 1, 'ss13' 1, 'ss14' 1, 'ss15' 1, 'ss16' 1, 'ss17' 1, 'ss18' 1, 'ss19' 1, 'ss20' 1" },
							{ title: "Stylistic Set 1", value: "'ss01' 1" },
							{ title: "Stylistic Set 2", value: "'ss02' 1" },
							{ title: "Stylistic Set 3", value: "'ss03' 1" },
							{ title: "Stylistic Set 4", value: "'ss04' 1" },
							{ title: "Stylistic Set 5", value: "'ss05' 1" },
							{ title: "Stylistic Set 6", value: "'ss06' 1" },
							{ title: "Stylistic Set 7", value: "'ss07' 1" },
							{ title: "Stylistic Set 8", value: "'ss08' 1" },
							{ title: "Stylistic Set 9", value: "'ss09' 1" },
							{ title: "Stylistic Set 10", value: "'ss10' 1" },
							{ title: "Stylistic Set 11", value: "'ss11' 1" },
							{ title: "Stylistic Set 12", value: "'ss12' 1" },
							{ title: "Stylistic Set 13", value: "'ss13' 1" },
							{ title: "Stylistic Set 14", value: "'ss14' 1" },
							{ title: "Stylistic Set 15", value: "'ss15' 1" },
							{ title: "Stylistic Set 16", value: "'ss16' 1" },
							{ title: "Stylistic Set 17", value: "'ss17' 1" },
							{ title: "Stylistic Set 18", value: "'ss18' 1" },
							{ title: "Stylistic Set 19", value: "'ss19' 1" },
							{ title: "Stylistic Set 20", value: "'ss20' 1" }
						]
					}
				},
				{
					type: 'string',
					title: 'Specialty CSS Implementation (for multi OT feautes)',
					name: 'specialtyCss',
					placeholder: "'c2sc' 1, 'ss02' 1"
				},
				{
					type: 'boolean',
					title: 'Disable Ligatures on default',
					name: 'ligatures',
				},
				{
					type: 'boolean',
					title: 'Disable Contextual Alternates on default',
					name: 'calt',
				},
				{
					type: 'boolean',
					title: 'Only Applies to Italics',
					name: 'italics',
				},
				],
				preview: {
				select: {
					title: 'title',
					subtitle: 'content'
				},
				prepare(selection) {
					const {title, subtitle} = selection;
					return {
						subtitle: subtitle,
						title: title
					};
				}
				}
			}
		]
		}
	]
};
