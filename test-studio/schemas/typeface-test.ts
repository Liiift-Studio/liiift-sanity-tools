// Test typeface document schema — mirrors the foundry platform typeface schema structure
import {
	BatchUploadFonts,
	GenerateCollectionsPairsComponent,
	UploadScriptsComponent,
	UpdateScriptsComponent,
	PrimaryCollectionGeneratorTypeface,
	openTypeField,
	styleCountField,
	stylisticSetField,
	createStylesField,
} from '../../sanity-font-uploader/src';
import { SCRIPTS_OBJECT } from '../../sanity-foundry-constants/src';
import { KeyValueInput } from '../../sanity-key-value-input/src';
import {
	freeFontField,
	includesSerifField,
	sortHeaviestFirstField,
	fontSizeMultiplierField,
	createStateField,
	releaseDateField,
	classificationField,
	metadataField,
} from '../../sanity-typeface-fields/src';

// Collection and Pair document types (referenced by the styles field)
export const collectionSchema = {
	title: 'Collection',
	name: 'collection',
	type: 'document',
	fields: [
		{ title: 'Title', name: 'title', type: 'string', validation: (Rule: any) => Rule.required() },
		{
			title: 'Fonts',
			name: 'fonts',
			type: 'array',
			of: [{ type: 'reference', weak: true, to: [{ type: 'font' }] }],
		},
		{
			title: 'Price',
			name: 'price',
			type: 'number',
		},
	],
};

export const pairSchema = {
	title: 'Pair',
	name: 'pair',
	type: 'document',
	fields: [
		{ title: 'Title', name: 'title', type: 'string', validation: (Rule: any) => Rule.required() },
		{
			title: 'Fonts',
			name: 'fonts',
			type: 'array',
			of: [{ type: 'reference', weak: true, to: [{ type: 'font' }] }],
		},
		{
			title: 'Price',
			name: 'price',
			type: 'number',
		},
	],
};

export const typefaceTestSchema = {
	title: 'Typeface',
	name: 'typeface',
	type: 'document',
	groups: [
		{ name: 'identity', title: 'Identity'},
		{ name: 'description', title: 'Description' },
		{ name: 'commercial', title: 'Commercial' },
		{ name: 'styles', title: 'Styles' },
		{ name: 'typeDetails', title: 'Type Details' },
		{ name: 'openType', title: 'OpenType' },
		{ name: 'stylisticSets', title: 'Stylistic Sets' },
	],
	fields: [

		// --- Identity ---

		{
			title: 'Title',
			name: 'title',
			type: 'string',
			group: 'identity',
			description: 'Should match Font Typeface Title.',
			validation: (Rule: any) => Rule.required(),
		},
		{
			title: 'Slug',
			name: 'slug',
			type: 'slug',
			group: 'identity',
			options: { source: 'title', maxLength: 96 },
			validation: (Rule: any) => Rule.required(),
		},
		{ ...createStateField(), group: 'identity' },
		{
			title: 'Highlight',
			name: 'highlight',
			type: 'boolean',
			group: 'identity',
			initialValue: false,
			description: 'Pins this typeface as featured in the catalogue.',
		},
		{ ...releaseDateField, group: 'identity' },
		{ ...classificationField, group: 'identity' },
		{
			...metadataField,
			group: 'identity',
			components: { input: KeyValueInput },
			description: 'Internal key-value data (e.g., designer, foundry URL). Not shown publicly.',
		},

		// --- Description ---

		{
			title: 'Description Title',
			name: 'descriptionTitle',
			type: 'string',
			group: 'description',
		},
		{
			title: 'Description',
			name: 'description',
			type: 'array',
			group: 'description',
			of: [{ type: 'block' }],
		},

		// --- Commercial ---

		{ ...freeFontField, group: 'commercial' },
		{ ...sortHeaviestFirstField, group: 'styles', description: 'Display styles from heaviest to lightest weight in the buy section.' },
		{ ...fontSizeMultiplierField, group: 'styles', description: 'Scales the font size in the style tester. 1.0 = default.' },

		// --- Styles (font manager integration) ---

		{
			name: 'stylesUploader',
			type: 'string',
			group: 'styles',
			description: "Batch upload all of the typeface's fonts at once.",
			components: { input: BatchUploadFonts },
		},
		{
			title: 'Generate Collections and Pairs',
			name: 'generateCollections',
			type: 'string',
			group: 'styles',
			description: 'Generate Collections and Pairs from the typeface fonts.',
			components: { input: GenerateCollectionsPairsComponent },
			hidden: true,
		},
		{
			title: 'Generate Full Family Collection',
			name: 'generateCollectionGroup',
			description: 'Generate a Collection that includes all styles from this typeface.',
			type: 'string',
			group: 'styles',
			components: { input: PrimaryCollectionGeneratorTypeface },
			hidden: ({ parent }: any) => !(parent?.styles?.fonts) || parent?.styles?.fonts?.length === 0,
		},
		{
			title: 'Scripts Uploader',
			name: 'scriptsUploader',
			description: 'Batch upload font files for different scripts.',
			type: 'string',
			group: 'styles',
			components: { input: UploadScriptsComponent },
		},
		{
			title: 'Supported Scripts',
			name: 'scripts',
			type: 'array',
			group: 'styles',
			description: 'Scripts this typeface supports. Updated when uploading via script uploader.',
			of: [{ type: 'string' }],
			components: { input: UpdateScriptsComponent },
			options: { list: SCRIPTS_OBJECT, layout: 'checkbox' },
		},
		{
			...createStylesField({
				free: false,
				displayStyles: false,
				sortHeaviestFirst: false,
				buySectionColumns: false,
				fontSizeMultiplier: false,
				serif: false,
				regenerateSubfamilies: true,
				subfamilyFontSizeMultiplier: true,
				subfamilyListOrder: true,
				subfamilyPreferredStyle: true,
				subfamilyFontFilter: true,
				subfamilyPreview: true,
				pairs: false,
			}),
			group: 'styles',
		},

		// --- Type Details ---

		{ ...includesSerifField, group: 'typeDetails' },
		openTypeField,
		styleCountField,
		stylisticSetField,
	],
	preview: {
		select: {
			title: 'title',
			state: 'state',
			fontCount: 'styles.fonts',
		},
		prepare({ title, state, fontCount }: any) {
			const count = fontCount?.length || 0;
			return {
				title,
				subtitle: [state || 'draft', `${count} font${count !== 1 ? 's' : ''}`].join(' — '),
			};
		},
	},
};
