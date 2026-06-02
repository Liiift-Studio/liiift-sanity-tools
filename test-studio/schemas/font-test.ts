// Test font document schema — mirrors the foundry platform font schema structure
import {
	SingleUploaderTool,
	FontScriptUploaderComponent,
	VariableInstanceReferencesInput,
} from '../../sanity-font-uploader/src';
import { SCRIPTS } from '../../sanity-foundry-constants/src';

export const fontTestSchema = {
	title: 'Font',
	name: 'font',
	type: 'document',
	groups: [
		{ name: 'identity', title: 'Identity', default: true },
		{ name: 'files', title: 'Files' },
		{ name: 'pricing', title: 'Pricing' },
	],
	fields: [

		// --- Identity ---

		{
			title: 'Title',
			name: 'title',
			type: 'string',
			group: 'identity',
			description: 'Required to upload files — CSS is dependent on it.',
			validation: (Rule: any) => Rule.required(),
		},
		{
			title: 'Slug',
			name: 'slug',
			type: 'slug',
			group: 'identity',
			description: 'Required to upload files — file names must match slug.',
			options: {
				source: 'title',
				slugify: (input: string) => input.toLowerCase().replace(/\s+/g, '-').slice(0, 200),
			},
			validation: (Rule: any) => Rule.required(),
		},
		{
			title: 'Typeface Name',
			name: 'typefaceName',
			type: 'string',
			group: 'identity',
			description: 'Should match the typeface title.',
		},
		{
			title: 'Typeface Subfamily',
			name: 'subfamily',
			type: 'string',
			group: 'identity',
		},
		{
			title: 'Weight Name',
			name: 'weightName',
			type: 'string',
			group: 'identity',
		},
		{
			title: 'Style',
			name: 'style',
			type: 'string',
			group: 'identity',
			options: {
				list: [
					{ title: 'Regular', value: 'Regular' },
					{ title: 'Italic', value: 'Italic' },
				],
			},
			initialValue: 'Regular',
		},
		{
			title: 'Variable Font',
			name: 'variableFont',
			type: 'boolean',
			group: 'identity',
			initialValue: false,
		},

		// --- Files ---

		{
			title: 'Files',
			name: 'fileInput',
			type: 'object',
			group: 'files',
			description: 'Fine-tune individual font files. Batch upload via the Typeface page is recommended.',
			fields: [
				{ title: 'TTF file', name: 'ttf', type: 'file' },
				{ title: 'OTF file', name: 'otf', type: 'file' },
				{ title: 'WOFF file', name: 'woff', type: 'file' },
				{ title: 'WOFF2 file', name: 'woff2', type: 'file' },
				{ title: 'EOT file', name: 'eot', type: 'file' },
				{ title: 'SVG file', name: 'svg', type: 'file' },
				{ title: 'CSS file', name: 'css', type: 'file' },
				{ title: 'WOFF2 Subset', name: 'woff2_subset', type: 'file', description: 'Auto-generated Latin display subset.' },
				{ title: 'WOFF2 Web', name: 'woff2_web', type: 'file', description: 'Auto-generated fingerprinted copy for web delivery.' },
			],
			components: { input: SingleUploaderTool },
		},
		// scriptFileInput only included when SANITY_STUDIO_SCRIPTS env var is set
		...(SCRIPTS.length > 0 ? [{
			title: 'Script Files',
			name: 'scriptFileInput',
			type: 'object',
			group: 'files',
			hidden: true,
			fields: SCRIPTS.map((cur: string) => ({
				title: cur,
				name: cur,
				type: 'object',
				fields: [
					{ title: 'TTF file', name: 'ttf', type: 'file' },
					{ title: 'OTF file', name: 'otf', type: 'file' },
					{ title: 'WOFF file', name: 'woff', type: 'file' },
					{ title: 'WOFF2 file', name: 'woff2', type: 'file' },
					{ title: 'EOT file', name: 'eot', type: 'file' },
					{ title: 'SVG file', name: 'svg', type: 'file' },
					{ title: 'CSS file', name: 'css', type: 'file' },
				],
			})),
			components: { input: FontScriptUploaderComponent },
			options: { collapsible: true },
		}] : []),
		{
			title: 'Variable Font Instances',
			name: 'variableInstanceReferences',
			description: 'Maps named instances from this variable font to their equivalent static font documents.',
			type: 'array',
			group: 'files',
			hidden: ({ parent }: any) => !parent?.variableFont,
			components: { input: VariableInstanceReferencesInput },
			of: [
				{
					type: 'object',
					fields: [
						{ name: 'key', type: 'string', title: 'Instance Name' },
						{
							name: 'value',
							type: 'reference',
							title: 'Matching Font',
							weak: true,
							to: [{ type: 'font' }],
						},
					],
				},
			],
		},

		// --- Auto-generated metadata (hidden, populated by font manager) ---

		{
			title: 'Character Set',
			name: 'characterSet',
			readOnly: true,
			hidden: true,
			type: 'object',
			options: { collapsible: true, collapsed: true },
			fields: [{ title: 'Chars', name: 'chars', type: 'array', of: [{ type: 'number' }] }],
		},
		{
			title: 'Opentype Features',
			name: 'opentypeFeatures',
			readOnly: true,
			hidden: true,
			type: 'object',
			options: { collapsible: true, collapsed: true },
			fields: [{ title: 'Chars', name: 'chars', type: 'array', of: [{ type: 'string' }] }],
		},
		{ title: 'Variable Axes', name: 'variableAxes', readOnly: true, hidden: true, type: 'string' },
		{ title: 'Variable Instances', name: 'variableInstances', readOnly: true, hidden: true, type: 'string' },
		{ title: 'Glyph Count', name: 'glyphCount', readOnly: true, hidden: true, type: 'number' },
		{
			title: 'Meta Data',
			name: 'metaData',
			readOnly: true,
			hidden: true,
			type: 'object',
			options: { collapsible: true, collapsed: true },
			fields: [
				{ title: 'Postscript Name', name: 'postscriptName', type: 'string' },
				{ title: 'Full Name', name: 'fullName', type: 'string' },
				{ title: 'Family Name', name: 'familyName', type: 'string' },
				{ title: 'Sub Family Name', name: 'subfamilyName', type: 'string' },
				{ title: 'Copyright', name: 'copyright', type: 'string' },
				{ title: 'Version', name: 'version', type: 'string' },
				{ title: 'Generated Date', name: 'genDate', type: 'string' },
			],
		},
		{
			title: 'Metrics',
			name: 'metrics',
			readOnly: true,
			hidden: true,
			type: 'object',
			options: { collapsible: true, collapsed: true },
			fields: [
				{ title: 'Units Per Em', name: 'unitsPerEm', type: 'number' },
				{ title: 'Ascender', name: 'ascender', type: 'number' },
				{ title: 'Descender', name: 'descender', type: 'number' },
				{ title: 'Line Gap', name: 'lineGap', type: 'number' },
				{ title: 'Cap Height', name: 'capHeight', type: 'number' },
				{ title: 'X Height', name: 'xHeight', type: 'number' },
				{ title: 'Italic Angle', name: 'italicAngle', type: 'number' },
				{ title: 'Underline Position', name: 'underlinePosition', type: 'number' },
				{ title: 'Underline Thickness', name: 'underlineThickness', type: 'number' },
				{
					title: 'Bounding Box',
					name: 'boundingBox',
					type: 'object',
					fields: [
						{ title: 'X Min', name: 'minX', type: 'number' },
						{ title: 'Y Min', name: 'minY', type: 'number' },
						{ title: 'X Max', name: 'maxX', type: 'number' },
						{ title: 'Y Max', name: 'maxY', type: 'number' },
					],
				},
			],
		},

		// --- Pricing ---

		{
			title: 'Normal Weight',
			name: 'normalWeight',
			type: 'boolean',
			group: 'pricing',
			initialValue: true,
			description: 'Enable to assign a numeric CSS font-weight. Disable for decorative styles.',
		},
		{
			title: 'Weight',
			name: 'weight',
			type: 'number',
			group: 'pricing',
			hidden: ({ parent }: any) => !parent?.normalWeight,
			initialValue: 400,
			description: 'CSS font-weight (100-900). Used for sorting and rendering.',
		},
		{
			title: 'Sell',
			name: 'sell',
			type: 'boolean',
			group: 'pricing',
			initialValue: true,
		},
		{
			title: 'is Free',
			name: 'isFree',
			type: 'boolean',
			group: 'pricing',
			initialValue: false,
			description: 'Free Desktop Licenses',
		},
		{
			title: 'Price',
			name: 'price',
			type: 'number',
			group: 'pricing',
			initialValue: 50,
			hidden: ({ parent }: any) => !parent?.sell,
		},
	],
	preview: {
		select: {
			title: 'title',
			weight: 'weight',
			style: 'style',
			variableFont: 'variableFont',
		},
		prepare({ title, weight, style, variableFont }: any) {
			const parts = [
				weight ? String(weight) : null,
				style || null,
				variableFont ? 'Variable' : null,
			].filter(Boolean);
			return {
				title,
				subtitle: parts.join(' — ') || 'No weight set',
			};
		},
	},
};
