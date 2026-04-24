// Tests for generateKeywords utility — reverseSpellingLookup, expandAbbreviations, removeWeightNames, generateStyleKeywords
import { describe, it, expect } from 'vitest';
import {
	reverseSpellingLookup,
	expandAbbreviations,
	removeWeightNames,
	generateStyleKeywords,
} from '../utils/generateKeywords';

describe('reverseSpellingLookup', () => {
	it('returns the canonical name for an exact abbreviation match', () => {
		expect(reverseSpellingLookup('Bd')).toBe('Bold');
		expect(reverseSpellingLookup('Bld')).toBe('Bold');
		expect(reverseSpellingLookup('Xlt')).toBe('ExtraLight');
		expect(reverseSpellingLookup('Lt')).toBe('Light');
		expect(reverseSpellingLookup('Thn')).toBe('Thin');
		expect(reverseSpellingLookup('Reg')).toBe('Regular');
		expect(reverseSpellingLookup('Med')).toBe('Medium');
		expect(reverseSpellingLookup('Ital')).toBe('Italic');
		expect(reverseSpellingLookup('It')).toBe('Italic');
		expect(reverseSpellingLookup('Obl')).toBe('Oblique');
		expect(reverseSpellingLookup('Blk')).toBe('Black');
	});

	it('prefers exact match over word-boundary match to avoid partial collisions', () => {
		// 'SemiBd' must resolve to SemiBold, not Bold (both Bd and SemiBd are in alternativeSpelling)
		expect(reverseSpellingLookup('SemiBd')).toBe('SemiBold');
		expect(reverseSpellingLookup('XBd')).toBe('ExtraBold');
		expect(reverseSpellingLookup('XLt')).toBe('ExtraLight');
	});

	it('returns the canonical name for a word-boundary match within a longer string', () => {
		expect(reverseSpellingLookup('MyFont Bd')).toBe('Bold');
		expect(reverseSpellingLookup('Futura Lt')).toBe('Light');
	});

	it('returns an empty string for unknown words', () => {
		expect(reverseSpellingLookup('Futura')).toBe('');
		expect(reverseSpellingLookup('Regular')).toBe('');
		expect(reverseSpellingLookup('Bold')).toBe('');
	});

	it('returns an empty string for empty input', () => {
		expect(reverseSpellingLookup('')).toBe('');
	});

	it('handles case-sensitive abbreviations correctly', () => {
		expect(reverseSpellingLookup('md')).toBe('Medium');
		expect(reverseSpellingLookup('med')).toBe('Medium');
	});
});

describe('expandAbbreviations', () => {
	it('expands a single-word abbreviation', () => {
		expect(expandAbbreviations('Bd')).toBe('Bold');
		expect(expandAbbreviations('Lt')).toBe('Light');
		expect(expandAbbreviations('Ital')).toBe('Italic');
	});

	it('expands each word in a multi-word string', () => {
		expect(expandAbbreviations('Xlt Bd')).toBe('ExtraLight Bold');
		expect(expandAbbreviations('SemiBd It')).toBe('SemiBold Italic');
	});

	it('preserves words that are not abbreviations', () => {
		expect(expandAbbreviations('MyFont Bold')).toBe('MyFont Bold');
		expect(expandAbbreviations('Futura Light')).toBe('Futura Light');
	});

	it('returns the original value for falsy input', () => {
		expect(expandAbbreviations('')).toBe('');
		expect(expandAbbreviations(null)).toBe(null);
		expect(expandAbbreviations(undefined)).toBe(undefined);
	});
});

describe('removeWeightNames', () => {
	it('removes a core weight word from a string', () => {
		expect(removeWeightNames('MyFont Bold')).toBe('MyFont');
		expect(removeWeightNames('MyFont Light')).toBe('MyFont');
		expect(removeWeightNames('MyFont Regular')).toBe('MyFont');
		expect(removeWeightNames('MyFont Black')).toBe('MyFont');
	});

	it('removes modifier + weight combinations', () => {
		expect(removeWeightNames('MyFont SemiBold')).toBe('MyFont');
		expect(removeWeightNames('MyFont ExtraLight')).toBe('MyFont');
	});

	it('removes abbreviated weight names via reverseSpellingLookup', () => {
		expect(removeWeightNames('MyFont Bd')).toBe('MyFont');
		expect(removeWeightNames('MyFont Lt')).toBe('MyFont');
	});

	it('leaves non-weight words intact', () => {
		expect(removeWeightNames('Futura Display')).toBe('Futura Display');
	});

	it('returns the original value for falsy input', () => {
		expect(removeWeightNames('')).toBe('');
		expect(removeWeightNames(null)).toBe(null);
	});

	it('returns an empty string when the entire input is a weight name', () => {
		expect(removeWeightNames('Bold')).toBe('');
		expect(removeWeightNames('Light')).toBe('');
	});
});

describe('generateStyleKeywords', () => {
	it('returns non-empty weight and italic keyword lists', () => {
		const { weightKeywordList, italicKeywordList } = generateStyleKeywords();
		expect(weightKeywordList.length).toBeGreaterThan(0);
		expect(italicKeywordList.length).toBeGreaterThan(0);
	});

	it('sorts keywords longest-first so more specific matches win', () => {
		const { weightKeywordList, italicKeywordList } = generateStyleKeywords();
		for (let i = 0; i < weightKeywordList.length - 1; i++) {
			expect(weightKeywordList[i].length).toBeGreaterThanOrEqual(weightKeywordList[i + 1].length);
		}
		for (let i = 0; i < italicKeywordList.length - 1; i++) {
			expect(italicKeywordList[i].length).toBeGreaterThanOrEqual(italicKeywordList[i + 1].length);
		}
	});

	it('deduplicates entries in both lists', () => {
		const { weightKeywordList, italicKeywordList } = generateStyleKeywords();
		expect(new Set(weightKeywordList).size).toBe(weightKeywordList.length);
		expect(new Set(italicKeywordList).size).toBe(italicKeywordList.length);
	});

	it('includes core weight names in the weight list', () => {
		const { weightKeywordList } = generateStyleKeywords();
		expect(weightKeywordList).toContain('Bold');
		expect(weightKeywordList).toContain('Light');
		expect(weightKeywordList).toContain('Regular');
		expect(weightKeywordList).toContain('Black');
	});

	it('includes core italic keywords in the italic list', () => {
		const { italicKeywordList } = generateStyleKeywords();
		expect(italicKeywordList).toContain('Italic');
		expect(italicKeywordList).toContain('Oblique');
	});

	it('includes abbreviations in the weight list', () => {
		const { weightKeywordList } = generateStyleKeywords();
		expect(weightKeywordList).toContain('Bd');
		expect(weightKeywordList).toContain('Lt');
		expect(weightKeywordList).toContain('Blk');
	});
});
