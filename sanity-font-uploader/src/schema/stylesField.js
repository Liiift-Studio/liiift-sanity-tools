// Sanity schema factory function for the Styles object field — call createStylesField(options) to generate the field definition for a typeface document
import { AdvancedRefArray } from 'sanity-advanced-reference-array';
import { RegenerateSubfamiliesComponent } from '../components/RegenerateSubfamiliesComponent.jsx';

// Shared GROQ filter — returns fonts from the same typeface, excluding items already in the array
const fontsFilter = async ({ getClient, document, parent }) => {
	const client = getClient({ apiVersion: '2022-11-09' });
	const typefaceName = document.title;
	const fonts = await client.fetch('*[_type == "font" && lower(typefaceName) == lower($typefaceName)]', { typefaceName });
	const relatedItemsFiltered = fonts.map(f => f._id).filter(Boolean);
	const existingItems = parent.map(f => f._ref).filter(Boolean);
	return {
		filter: '!(_id in $existingItems) && (_id in $relatedItemsFiltered)',
		params: { existingItems, relatedItemsFiltered },
	};
};

// Shared GROQ filter — returns variable fonts from the same typeface, excluding items already in the array
const variableFontsFilter = async ({ getClient, document, parent }) => {
	const client = getClient({ apiVersion: '2022-11-09' });
	const typefaceName = document.title;
	const existingItems = parent.map(f => f._ref).filter(Boolean);
	const fonts = await client.fetch('*[_type == "font" && typefaceName == $typefaceName && variableFont == true]', { typefaceName });
	const relatedItemsFiltered = fonts.map(f => f._id).filter(Boolean);
	return {
		filter: '!(_id in $existingItems) && (_id in $relatedItemsFiltered)',
		params: { existingItems, relatedItemsFiltered },
	};
};

/**
 * Generates the Styles object field for a typeface document with configurable per-site options.
 * @param {Object} options
 * @param {boolean} [options.hasFreeFlag=false] - Add a "Free Typeface" boolean field (MCKL)
 * @param {boolean} [options.displayStylesHidden=false] - Hide the displayStyles boolean from editors (Darden, MCKL)
 * @param {boolean} [options.hasSortHeaviestFirst=false] - Add sort order toggle (TDF)
 * @param {boolean} [options.hasBuySectionColumns=false] - Add multi-column buy section toggle (TDF)
 * @param {boolean} [options.hasFontSizeMultiplier=false] - Add style grid font size multiplier (TDF)
 * @param {boolean} [options.hasSerifFlag=false] - Add serif/sans classification flag (TDF)
 * @param {boolean} [options.hasRegenerateSubfamilies=false] - Add the RegenerateSubfamilies action field (TDF, MCKL)
 * @param {boolean} [options.hasSubfamilyFontSizeMultiplier=false] - Add per-subfamily font size multiplier (TDF)
 * @param {boolean} [options.hasSubfamilyUseListOrder=false] - Add per-subfamily manual order toggle (TDF)
 * @param {boolean} [options.hasSubfamilyPreferredStyle=false] - Add per-subfamily preferred style reference (TDF)
 * @param {boolean} [options.hasSubfamilyFontFilter=false] - Filter subfamily font picker to typeface fonts only (TDF)
 * @param {boolean} [options.hasSubfamilyPreview=false] - Add preview to subfamily array items showing font count (MCKL)
 * @param {boolean} [options.pairsHidden=false] - Hide the pairs array from editors (Darden)
 */
export function createStylesField({
	hasFreeFlag = false,
	displayStylesHidden = false,
	hasSortHeaviestFirst = false,
	hasBuySectionColumns = false,
	hasFontSizeMultiplier = false,
	hasSerifFlag = false,
	hasRegenerateSubfamilies = false,
	hasSubfamilyFontSizeMultiplier = false,
	hasSubfamilyUseListOrder = false,
	hasSubfamilyPreferredStyle = false,
	hasSubfamilyFontFilter = false,
	hasSubfamilyPreview = false,
	pairsHidden = false,
} = {}) {

	// Build the subfamily object item fields conditionally
	const subfamilyFields = [
		{
			title: 'Title',
			name: 'title',
			type: 'string',
		},
		...(hasSubfamilyFontSizeMultiplier ? [{
			title: 'Subfamily Font Size Multiplier',
			name: 'fontSizeMultiplier',
			type: 'number',
			initialValue: 1.0,
			description: 'Adjust font size for this subfamily in the Family Overview (Design Space). Default is 1.0 (100%). Range: 0.5 to 2.0',
			validation: Rule => Rule.min(0.5).max(2.0).precision(2),
		}] : []),
		...(hasSubfamilyUseListOrder ? [{
			title: 'Use List Order',
			name: 'useListOrder',
			type: 'boolean',
			initialValue: false,
			description: 'Display fonts in the manual order listed below, bypassing programmatic weight-based sorting in the Family Overview.',
		}] : []),
		{
			title: 'Fonts',
			name: 'fonts',
			type: 'array',
			components: { input: AdvancedRefArray },
			of: [{ type: 'reference', weak: true, to: [{ type: 'font' }] }],
			options: {
				sortable: true,
				...(hasSubfamilyFontFilter ? { filter: fontsFilter } : {}),
			},
		},
		...(hasSubfamilyPreferredStyle ? [{
			title: 'SubFamily Preferred Style',
			name: 'preferredStyle',
			type: 'reference',
			weak: true,
			to: [{ type: 'font' }],
			options: {
				filter: async ({ getClient, document, parent }) => {
					const client = getClient({ apiVersion: '2022-11-09' });
					const typefaceName = document.title;
					const fonts = await client.fetch('*[_type == "font" && typefaceName == $typefaceName && variableFont == false]', { typefaceName });
					const relatedItemsFiltered = fonts.map(f => f._id).filter(Boolean);
					const existingItems = parent.fonts.map(f => f._ref).filter(Boolean);
					return {
						filter: '(_id in $existingItems) && (_id in $relatedItemsFiltered)',
						params: { existingItems, relatedItemsFiltered },
					};
				},
			},
		}] : []),
	];

	const subfamilyItem = {
		type: 'object',
		fields: subfamilyFields,
		...(hasSubfamilyPreview ? {
			preview: {
				select: { title: 'title', fonts: 'fonts' },
				prepare(props) {
					const numFonts = Object.keys(props.fonts || {}).length;
					return { title: props.title, subtitle: `${numFonts} fonts` };
				},
			},
		} : {}),
	};

	const fields = [
		...(hasFreeFlag ? [{
			title: 'Free Typeface',
			name: 'free',
			type: 'boolean',
			description: 'This typeface is free to download and use. This will alter the "Buy" button and checkout experience.',
			initialValue: false,
		}] : []),
		{
			title: 'Display All Styles',
			name: 'displayStyles',
			type: 'boolean',
			initialValue: true,
			hidden: displayStylesHidden,
			description: 'Show all Font Styles below collections in Buy Section',
		},
		...(hasSortHeaviestFirst ? [{
			title: 'Sort Fonts Heaviest to Lightest',
			name: 'sortHeaviestFirst',
			type: 'boolean',
			initialValue: false,
			description: 'Sort fonts by weight from heaviest (900) to lightest (100). Default is lightest to heaviest (industry standard).',
		}] : []),
		...(hasBuySectionColumns ? [{
			title: 'Multi Column Buy Section',
			name: 'buySectionColumns',
			type: 'boolean',
			initialValue: true,
			description: 'Choose Single Column or Multi Column for the Buy Section, Default is Multi Column',
		}] : []),
		...(hasFontSizeMultiplier ? [{
			title: 'Style Grid Font Size Multiplier',
			name: 'fontSizeMultiplier',
			type: 'number',
			initialValue: 1.0,
			description: 'Adjust font size in the buy section style grid. Default is 1.0 (100%). Range: 0.5 to 2.0',
			validation: Rule => Rule.min(0.5).max(2.0).precision(2),
		}] : []),
		...(hasSerifFlag ? [{
			title: 'Includes Serifs',
			name: 'serif',
			type: 'boolean',
			initialValue: false,
			description: 'Check if this typeface includes serif letterforms. Used for typeface overview serif/sans filters. Frontend automatically treats non-serif typefaces as sans serif.',
		}] : []),
		{
			title: 'Fonts',
			name: 'fonts',
			type: 'array',
			components: { input: AdvancedRefArray },
			of: [{
				type: 'reference',
				weak: true,
				to: [{ type: 'font' }],
				options: { filter: fontsFilter },
			}],
			options: { sortable: true },
		},
		{
			title: 'Variable Fonts',
			name: 'variableFont',
			type: 'array',
			components: { input: AdvancedRefArray },
			of: [{
				type: 'reference',
				weak: true,
				to: [{ type: 'font' }],
				options: { filter: variableFontsFilter },
			}],
			description: 'Variable fonts are automatically included as a bonus when customers purchase all non-variable styles of this typeface.',
			options: { sortable: true },
		},
		...(hasRegenerateSubfamilies ? [{
			title: 'Regenerate Subfamilies',
			name: 'regenerateSubfamilies',
			type: 'string',
			hidden: ({ parent }) => {
				return parent?.styles?.subfamilies?.length === 0 || parent?.styles?.fonts?.length === 0;
			},
			description: 'Regenerates subfamily groups based on the fonts in this typeface.',
			components: { input: RegenerateSubfamiliesComponent },
		}] : []),
		{
			title: 'Sub Families',
			name: 'subfamilies',
			type: 'array',
			of: [subfamilyItem],
		},
		{
			title: 'Collections',
			name: 'collections',
			type: 'array',
			components: { input: AdvancedRefArray },
			of: [{ type: 'reference', weak: true, to: [{ type: 'collection' }] }],
			options: { sortable: true },
			validation: Rule => Rule.unique(),
		},
		{
			title: 'Pairs',
			name: 'pairs',
			type: 'array',
			components: { input: AdvancedRefArray },
			of: [{ type: 'reference', weak: true, to: [{ type: 'pair' }] }],
			options: { sortable: true },
			validation: Rule => Rule.unique(),
			hidden: pairsHidden,
		},
	];

	return {
		title: 'Styles',
		name: 'styles',
		type: 'object',
		group: 'styles',
		fields,
		options: { collapsible: true },
	};
}
