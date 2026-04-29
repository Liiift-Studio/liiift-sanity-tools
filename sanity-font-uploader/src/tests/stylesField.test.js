// Tests for createStylesField — schema structure, conditional fields, hidden logic, filter null guards
import { describe, it, expect, vi } from 'vitest';

vi.mock('@liiift-studio/sanity-advanced-reference-array', () => ({ AdvancedRefArray: 'AdvancedRefArray' }));
vi.mock('../components/RegenerateSubfamiliesComponent.jsx', () => ({ RegenerateSubfamiliesComponent: 'RegenerateSubfamiliesComponent' }));

import { createStylesField } from '../schema/stylesField.js';

/** Returns a field from a fields array by name */
const getField = (fields, name) => fields.find(f => f.name === name);

/** Returns a field from the subfamily item's fields by name */
const getSubfamilyField = (schema, name) => {
	const subfamilies = getField(schema.fields, 'subfamilies');
	return subfamilies.of[0].fields.find(f => f.name === name);
};

/** Builds a minimal mock Sanity client */
const mockClient = (results = []) => ({
	fetch: vi.fn().mockResolvedValue(results),
});

describe('createStylesField', () => {

	describe('schema shape', () => {
		it('returns an object field named styles in the styles group', () => {
			const schema = createStylesField();
			expect(schema.name).toBe('styles');
			expect(schema.type).toBe('object');
			expect(schema.group).toBe('styles');
			expect(schema.options.collapsible).toBe(true);
		});

		it('always includes displayStyles, fonts, variableFont, subfamilies, collections, pairs', () => {
			const names = createStylesField().fields.map(f => f.name);
			expect(names).toContain('displayStyles');
			expect(names).toContain('fonts');
			expect(names).toContain('variableFont');
			expect(names).toContain('subfamilies');
			expect(names).toContain('collections');
			expect(names).toContain('pairs');
		});

		it('excludes all optional fields by default', () => {
			const names = createStylesField().fields.map(f => f.name);
			expect(names).not.toContain('free');
			expect(names).not.toContain('sortHeaviestFirst');
			expect(names).not.toContain('buySectionColumns');
			expect(names).not.toContain('fontSizeMultiplier');
			expect(names).not.toContain('serif');
			expect(names).not.toContain('regenerateSubfamilies');
		});

		it('works with no arguments passed', () => {
			expect(() => createStylesField()).not.toThrow();
		});
	});

	describe('additive flags', () => {
		it.each([
			['free', { free: true }],
			['sortHeaviestFirst', { sortHeaviestFirst: true }],
			['buySectionColumns', { buySectionColumns: true }],
			['fontSizeMultiplier', { fontSizeMultiplier: true }],
			['serif', { serif: true }],
			['regenerateSubfamilies', { regenerateSubfamilies: true }],
		])('adds %s field when %s', (name, options) => {
			const schema = createStylesField(options);
			expect(getField(schema.fields, name)).toBeDefined();
		});

		it.each([
			['free', { free: false }],
			['sortHeaviestFirst', { sortHeaviestFirst: false }],
			['buySectionColumns', { buySectionColumns: false }],
			['fontSizeMultiplier', { fontSizeMultiplier: false }],
			['serif', { serif: false }],
			['regenerateSubfamilies', { regenerateSubfamilies: false }],
		])('omits %s field when %s', (name, options) => {
			const schema = createStylesField(options);
			expect(getField(schema.fields, name)).toBeUndefined();
		});
	});

	describe('displayStyles visibility', () => {
		it('is visible by default', () => {
			expect(getField(createStylesField().fields, 'displayStyles').hidden).toBe(false);
		});

		it('is hidden when displayStyles: false', () => {
			expect(getField(createStylesField({ displayStyles: false }).fields, 'displayStyles').hidden).toBe(true);
		});
	});

	describe('pairs visibility', () => {
		it('is visible by default', () => {
			expect(getField(createStylesField().fields, 'pairs').hidden).toBe(false);
		});

		it('is hidden when pairs: false', () => {
			expect(getField(createStylesField({ pairs: false }).fields, 'pairs').hidden).toBe(true);
		});
	});

	describe('regenerateSubfamilies hidden logic', () => {
		const hiddenFn = () => getField(
			createStylesField({ regenerateSubfamilies: true }).fields,
			'regenerateSubfamilies'
		).hidden;

		it('hides when subfamilies array is empty', () => {
			expect(hiddenFn()({ parent: { subfamilies: [], fonts: ['a'] } })).toBe(true);
		});

		it('hides when fonts array is empty', () => {
			expect(hiddenFn()({ parent: { subfamilies: ['a'], fonts: [] } })).toBe(true);
		});

		it('hides when subfamilies is undefined', () => {
			expect(hiddenFn()({ parent: { fonts: ['a'] } })).toBe(true);
		});

		it('hides when fonts is undefined', () => {
			expect(hiddenFn()({ parent: { subfamilies: ['a'] } })).toBe(true);
		});

		it('hides when parent is empty object', () => {
			expect(hiddenFn()({ parent: {} })).toBe(true);
		});

		it('shows when both subfamilies and fonts have items', () => {
			expect(hiddenFn()({ parent: { subfamilies: ['a'], fonts: ['b'] } })).toBe(false);
		});
	});

	describe('subfamily fields', () => {
		it('always contains title and fonts', () => {
			const names = getField(createStylesField().fields, 'subfamilies').of[0].fields.map(f => f.name);
			expect(names).toContain('title');
			expect(names).toContain('fonts');
		});

		it('excludes optional subfamily fields by default', () => {
			const names = getField(createStylesField().fields, 'subfamilies').of[0].fields.map(f => f.name);
			expect(names).not.toContain('fontSizeMultiplier');
			expect(names).not.toContain('useListOrder');
			expect(names).not.toContain('preferredStyle');
		});

		it.each([
			['fontSizeMultiplier', { subfamilyFontSizeMultiplier: true }],
			['useListOrder', { subfamilyListOrder: true }],
			['preferredStyle', { subfamilyPreferredStyle: true }],
		])('adds subfamily %s when flag is true', (name, options) => {
			expect(getSubfamilyField(createStylesField(options), name)).toBeDefined();
		});

		it('adds fontsFilter to subfamily fonts when subfamilyFontFilter: true', () => {
			const schema = createStylesField({ subfamilyFontFilter: true });
			const subfamilyFonts = getSubfamilyField(schema, 'fonts');
			expect(subfamilyFonts.options.filter).toBeDefined();
		});

		it('does not add filter to subfamily fonts by default', () => {
			const schema = createStylesField();
			const subfamilyFonts = getSubfamilyField(schema, 'fonts');
			expect(subfamilyFonts.options.filter).toBeUndefined();
		});
	});

	describe('subfamilyPreview', () => {
		it('adds preview to subfamily item when subfamilyPreview: true', () => {
			const item = getField(createStylesField({ subfamilyPreview: true }).fields, 'subfamilies').of[0];
			expect(item.preview).toBeDefined();
		});

		it('does not add preview by default', () => {
			const item = getField(createStylesField().fields, 'subfamilies').of[0];
			expect(item.preview).toBeUndefined();
		});

		it('prepare returns title and correct font count', () => {
			const { prepare } = getField(createStylesField({ subfamilyPreview: true }).fields, 'subfamilies').of[0].preview;
			expect(prepare({ title: 'Condensed', fonts: ['a', 'b', 'c'] })).toEqual({
				title: 'Condensed',
				subtitle: '3 fonts',
			});
		});

		it('prepare returns 0 fonts when fonts is undefined', () => {
			const { prepare } = getField(createStylesField({ subfamilyPreview: true }).fields, 'subfamilies').of[0].preview;
			expect(prepare({ title: 'Condensed', fonts: undefined })).toEqual({
				title: 'Condensed',
				subtitle: '0 fonts',
			});
		});

		it('prepare returns 0 fonts when fonts is empty', () => {
			const { prepare } = getField(createStylesField({ subfamilyPreview: true }).fields, 'subfamilies').of[0].preview;
			expect(prepare({ title: 'Condensed', fonts: [] })).toEqual({
				title: 'Condensed',
				subtitle: '0 fonts',
			});
		});
	});

});

describe('filter null guards', () => {
	const getfontsFilter = () => {
		const schema = createStylesField();
		return getField(schema.fields, 'fonts').of[0].options.filter;
	};

	const getVariableFontsFilter = () => {
		const schema = createStylesField();
		return getField(schema.fields, 'variableFont').of[0].options.filter;
	};

	const getSubfamilyPreferredStyleFilter = () => {
		const schema = createStylesField({ subfamilyPreferredStyle: true });
		return getSubfamilyField(schema, 'preferredStyle').options.filter;
	};

	describe('fontsFilter', () => {
		it('returns empty existingItems when parent is undefined', async () => {
			const client = mockClient();
			const result = await getfontsFilter()({
				getClient: () => client,
				document: { title: 'Test' },
				parent: undefined,
			});
			expect(result.params.existingItems).toEqual([]);
		});

		it('returns empty existingItems when parent is empty array', async () => {
			const client = mockClient();
			const result = await getfontsFilter()({
				getClient: () => client,
				document: { title: 'Test' },
				parent: [],
			});
			expect(result.params.existingItems).toEqual([]);
		});

		it('excludes existing refs from the filter params', async () => {
			const client = mockClient([{ _id: 'font-a' }, { _id: 'font-b' }]);
			const result = await getfontsFilter()({
				getClient: () => client,
				document: { title: 'Test' },
				parent: [{ _ref: 'font-a' }],
			});
			expect(result.params.existingItems).toEqual(['font-a']);
			expect(result.params.relatedItemsFiltered).toContain('font-a');
		});
	});

	describe('variableFontsFilter', () => {
		it('returns empty existingItems when parent is undefined', async () => {
			const client = mockClient();
			const result = await getVariableFontsFilter()({
				getClient: () => client,
				document: { title: 'Test' },
				parent: undefined,
			});
			expect(result.params.existingItems).toEqual([]);
		});

		it('returns empty existingItems when parent is empty array', async () => {
			const client = mockClient();
			const result = await getVariableFontsFilter()({
				getClient: () => client,
				document: { title: 'Test' },
				parent: [],
			});
			expect(result.params.existingItems).toEqual([]);
		});
	});

	describe('subfamilyPreferredStyleFilter', () => {
		it('returns empty existingItems when parent.fonts is undefined', async () => {
			const client = mockClient();
			const result = await getSubfamilyPreferredStyleFilter()({
				getClient: () => client,
				document: { title: 'Test' },
				parent: { fonts: undefined },
			});
			expect(result.params.existingItems).toEqual([]);
		});

		it('returns empty existingItems when parent.fonts is empty', async () => {
			const client = mockClient();
			const result = await getSubfamilyPreferredStyleFilter()({
				getClient: () => client,
				document: { title: 'Test' },
				parent: { fonts: [] },
			});
			expect(result.params.existingItems).toEqual([]);
		});

		it('limits picker to fonts already in the subfamily', async () => {
			const client = mockClient([{ _id: 'font-a' }, { _id: 'font-b' }]);
			const result = await getSubfamilyPreferredStyleFilter()({
				getClient: () => client,
				document: { title: 'Test' },
				parent: { fonts: [{ _ref: 'font-a' }] },
			});
			expect(result.params.existingItems).toEqual(['font-a']);
			expect(result.filter).toContain('_id in $existingItems');
		});
	});
});
