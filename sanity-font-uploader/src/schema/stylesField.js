// Sanity schema factory function for the Styles object field — call createStylesField(options) to generate the field definition for a typeface document
import { AdvancedRefArray } from '@liiift-studio/sanity-advanced-reference-array';
import { RegenerateSubfamiliesComponent } from '../components/RegenerateSubfamiliesComponent.jsx';

// Conditionally includes a field definition in an array
const field = (condition, def) => condition ? [def] : [];

// GROQ filter — fonts from the same typeface, excluding items already in the array
const fontsFilter = async ({ getClient, document, parent }) => {
	const client = getClient({ apiVersion: '2022-11-09' });
	const typefaceName = document.title;
	const fonts = await client.fetch('*[_type == "font" && lower(typefaceName) == lower($typefaceName)]', { typefaceName });
	const relatedItemsFiltered = fonts.map(f => f._id).filter(Boolean);
	const existingItems = (parent || []).map(f => f._ref).filter(Boolean);
	return {
		filter: '!(_id in $existingItems) && (_id in $relatedItemsFiltered)',
		params: { existingItems, relatedItemsFiltered },
	};
};

// GROQ filter — variable fonts from the same typeface, excluding items already in the array
const variableFontsFilter = async ({ getClient, document, parent }) => {
	const client = getClient({ apiVersion: '2022-11-09' });
	const typefaceName = document.title;
	const existingItems = (parent || []).map(f => f._ref).filter(Boolean);
	const fonts = await client.fetch('*[_type == "font" && typefaceName == $typefaceName && variableFont == true]', { typefaceName });
	const relatedItemsFiltered = fonts.map(f => f._id).filter(Boolean);
	return {
		filter: '!(_id in $existingItems) && (_id in $relatedItemsFiltered)',
		params: { existingItems, relatedItemsFiltered },
	};
};

// GROQ filter — non-variable fonts already in the subfamily's fonts array, for preferred style picker
const subfamilyPreferredStyleFilter = async ({ getClient, document, parent }) => {
	const client = getClient({ apiVersion: '2022-11-09' });
	const typefaceName = document.title;
	const fonts = await client.fetch('*[_type == "font" && typefaceName == $typefaceName && variableFont == false]', { typefaceName });
	const relatedItemsFiltered = fonts.map(f => f._id).filter(Boolean);
	const existingItems = (parent.fonts || []).map(f => f._ref).filter(Boolean);
	return {
		filter: '(_id in $existingItems) && (_id in $relatedItemsFiltered)',
		params: { existingItems, relatedItemsFiltered },
	};
};

/**
 * Generates the Styles object field for a typeface document with configurable per-site options.
 * @param {Object} [options]
 * @param {boolean} [options.free=false] - Include "Free Typeface" boolean
 * @param {boolean} [options.displayStyles=true] - Show "Display All Styles" toggle to editors
 * @param {boolean} [options.sortHeaviestFirst=false] - Include sort order toggle
 * @param {boolean} [options.buySectionColumns=false] - Include multi-column buy section toggle
 * @param {boolean} [options.fontSizeMultiplier=false] - Include style grid font size multiplier
 * @param {boolean} [options.serif=false] - Include serif/sans classification field
 * @param {boolean} [options.regenerateSubfamilies=false] - Include RegenerateSubfamilies action
 * @param {boolean} [options.subfamilyFontSizeMultiplier=false] - Include per-subfamily font size multiplier
 * @param {boolean} [options.subfamilyListOrder=false] - Include per-subfamily manual order toggle
 * @param {boolean} [options.subfamilyPreferredStyle=false] - Include per-subfamily preferred style picker
 * @param {boolean} [options.subfamilyFontFilter=false] - Filter subfamily font picker to typeface fonts only
 * @param {boolean} [options.subfamilyPreview=false] - Include preview on subfamily array items
 * @param {boolean} [options.pairs=true] - Show pairs array to editors
 */
export function createStylesField({
	free = false,
	displayStyles = true,
	sortHeaviestFirst = false,
	buySectionColumns = false,
	fontSizeMultiplier = false,
	serif = false,
	regenerateSubfamilies = false,
	subfamilyFontSizeMultiplier = false,
	subfamilyListOrder = false,
	subfamilyPreferredStyle = false,
	subfamilyFontFilter = false,
	subfamilyPreview = false,
	pairs = true,
} = {}) {

	const subfamilyFields = [
		{
			title: 'Title',
			name: 'title',
			type: 'string',
		},
		...field(subfamilyFontSizeMultiplier, {
			title: 'Subfamily Font Size Multiplier',
			name: 'fontSizeMultiplier',
			type: 'number',
			initialValue: 1,
			description: 'Adjust font size for this subfamily in the Family Overview (Design Space). Default is 1.0 (100%). Range: 0.5 to 2.0',
			validation: Rule => Rule.min(0.5).max(2.0).precision(2),
		}),
		...field(subfamilyListOrder, {
			title: 'Use List Order',
			name: 'useListOrder',
			type: 'boolean',
			initialValue: false,
			description: 'Display fonts in the manual order listed below, bypassing programmatic weight-based sorting in the Family Overview.',
		}),
		{
			title: 'Fonts',
			name: 'fonts',
			type: 'array',
			components: { input: AdvancedRefArray },
			of: [{ type: 'reference', weak: true, to: [{ type: 'font' }] }],
			options: {
				sortable: true,
				...(subfamilyFontFilter ? { filter: fontsFilter } : {}),
			},
		},
		...field(subfamilyPreferredStyle, {
			title: 'Subfamily Preferred Style',
			name: 'preferredStyle',
			type: 'reference',
			weak: true,
			to: [{ type: 'font' }],
			options: { filter: subfamilyPreferredStyleFilter },
		}),
	];

	const subfamilyItem = {
		type: 'object',
		fields: subfamilyFields,
		...(subfamilyPreview ? {
			preview: {
				select: { title: 'title', fonts: 'fonts' },
				prepare({ title, fonts }) {
					return { title, subtitle: `${(fonts || []).length} fonts` };
				},
			},
		} : {}),
	};

	const fields = [
		...field(free, {
			title: 'Free Typeface',
			name: 'free',
			type: 'boolean',
			initialValue: false,
			description: 'This typeface is free to download and use. This will alter the "Buy" button and checkout experience.',
		}),
		{
			title: 'Display All Styles',
			name: 'displayStyles',
			type: 'boolean',
			initialValue: true,
			hidden: !displayStyles,
			description: 'Show all Font Styles below collections in Buy Section',
		},
		...field(sortHeaviestFirst, {
			title: 'Sort Fonts Heaviest to Lightest',
			name: 'sortHeaviestFirst',
			type: 'boolean',
			initialValue: false,
			description: 'Sort fonts by weight from heaviest (900) to lightest (100). Default is lightest to heaviest (industry standard).',
		}),
		...field(buySectionColumns, {
			title: 'Multi Column Buy Section',
			name: 'buySectionColumns',
			type: 'boolean',
			initialValue: true,
			description: 'Choose Single Column or Multi Column for the Buy Section, Default is Multi Column',
		}),
		...field(fontSizeMultiplier, {
			title: 'Style Grid Font Size Multiplier',
			name: 'fontSizeMultiplier',
			type: 'number',
			initialValue: 1,
			description: 'Adjust font size in the buy section style grid. Default is 1.0 (100%). Range: 0.5 to 2.0',
			validation: Rule => Rule.min(0.5).max(2.0).precision(2),
		}),
		...field(serif, {
			title: 'Includes Serifs',
			name: 'serif',
			type: 'boolean',
			initialValue: false,
			description: 'Check if this typeface includes serif letterforms. Used for typeface overview serif/sans filters. Frontend automatically treats non-serif typefaces as sans serif.',
		}),
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
		...field(regenerateSubfamilies, {
			title: 'Regenerate Subfamilies',
			name: 'regenerateSubfamilies',
			type: 'string',
			hidden: ({ parent }) => !parent?.subfamilies?.length || !parent?.fonts?.length,
			description: 'Regenerates subfamily groups based on the fonts in this typeface.',
			components: { input: RegenerateSubfamiliesComponent },
		}),
		{
			title: 'Subfamilies',
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
			hidden: !pairs,
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
