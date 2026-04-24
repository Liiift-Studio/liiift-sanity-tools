// Tests for processFontFiles pure utility functions — weight extraction, subfamily processing, sorting
import { describe, it, expect } from 'vitest';
import {
	extractWeightName,
	extractWeightFromFullName,
	processSubfamilyName,
	formatFontTitle,
	addItalicToFontTitle,
	determineWeight,
	sortFontObjects,
	createFontObject,
} from '../utils/processFontFiles';

// ---------------------------------------------------------------------------
// Shared mock helpers
// ---------------------------------------------------------------------------

/** Builds a minimal fontkit-shaped mock font object */
function mockFont({
	preferredSubfamily = null,
	fontSubfamily = 'Regular',
	fullName = 'MyFont Regular',
	fullNameEn = null,
	familyName = 'MyFont',
	italicAngle = 0,
	variationAxes = null,
	usWeightClass = null,
} = {}) {
	const font = {
		familyName,
		fullName,
		italicAngle,
		subfamilyName: fontSubfamily,
		name: {
			records: {
				preferredSubfamily: preferredSubfamily,
				fontSubfamily: fontSubfamily,
				fullName: fullNameEn ? { en: fullNameEn } : fullName,
			},
		},
	};
	if (variationAxes) font.variationAxes = variationAxes;
	if (usWeightClass) font['OS/2'] = { usWeightClass };
	return font;
}

// ---------------------------------------------------------------------------
// extractWeightName
// ---------------------------------------------------------------------------

describe('extractWeightName', () => {
	it('returns the preferredSubfamily when present', () => {
		const font = mockFont({ preferredSubfamily: 'SemiBold', fontSubfamily: 'Bold' });
		expect(extractWeightName(font, [])).toBe('SemiBold');
	});

	it('falls back to fontSubfamily when preferredSubfamily is absent', () => {
		const font = mockFont({ preferredSubfamily: null, fontSubfamily: 'Light' });
		expect(extractWeightName(font, [])).toBe('Light');
	});

	it('returns "Variable" for variable fonts', () => {
		const font = mockFont({ variationAxes: { wght: { min: 100, max: 900 } } });
		expect(extractWeightName(font, [])).toBe('Variable');
	});

	it('strips "Italic" from the weight name', () => {
		const font = mockFont({ fontSubfamily: 'Bold Italic' });
		expect(extractWeightName(font, [])).toBe('Bold');
	});

	it('strips italic keywords passed via italicKW', () => {
		const font = mockFont({ fontSubfamily: 'Bold Oblique' });
		expect(extractWeightName(font, ['Oblique'])).toBe('Bold');
	});

	it('handles preferredSubfamily as an object with an "en" key', () => {
		const font = mockFont({ fontSubfamily: 'Regular' });
		font.name.records.preferredSubfamily = { en: 'ExtraLight' };
		expect(extractWeightName(font, [])).toBe('ExtraLight');
	});
});

// ---------------------------------------------------------------------------
// extractWeightFromFullName
// ---------------------------------------------------------------------------

describe('extractWeightFromFullName', () => {
	it('strips the typeface title and italic suffix from fullName', () => {
		const font = mockFont({ fullName: 'MyFont SemiBold' });
		expect(extractWeightFromFullName(font, 'MyFont')).toBe('SemiBold');
	});

	it('strips "Italic" from the result', () => {
		const font = mockFont({ fullName: 'MyFont Bold Italic' });
		expect(extractWeightFromFullName(font, 'MyFont')).toBe('Bold');
	});

	it('works when fullName is an object with an "en" key', () => {
		const font = mockFont({ fullNameEn: 'MyFont ExtraLight' });
		expect(extractWeightFromFullName(font, 'MyFont')).toBe('ExtraLight');
	});
});

// ---------------------------------------------------------------------------
// processSubfamilyName
// ---------------------------------------------------------------------------

describe('processSubfamilyName', () => {
	const { weightKeywordList, italicKeywordList } = (() => {
		// Inline a minimal set so tests don't depend on generateStyleKeywords output stability
		return {
			weightKeywordList: ['Bold', 'Light', 'Regular', 'SemiBold', 'ExtraLight', 'Bd', 'Lt'],
			italicKeywordList: ['Italic', 'Oblique', 'Slant', 'It'],
		};
	})();

	it('strips weight keywords from the subfamily name', () => {
		const result = processSubfamilyName('Bold', weightKeywordList, italicKeywordList);
		expect(result.trim()).toBe('');
	});

	it('strips italic keywords from the subfamily name', () => {
		const result = processSubfamilyName('Italic', weightKeywordList, italicKeywordList);
		expect(result.trim()).toBe('');
	});

	it('strips both weight and italic in one pass', () => {
		const result = processSubfamilyName('Bold Italic', weightKeywordList, italicKeywordList);
		expect(result.trim()).toBe('');
	});

	it('preserves non-weight, non-italic words', () => {
		const result = processSubfamilyName('Condensed', weightKeywordList, italicKeywordList);
		expect(result.trim()).toBe('Condensed');
	});

	it('does not expand abbreviations when preserveShortenedNames is true', () => {
		const result = processSubfamilyName('Bd', weightKeywordList, italicKeywordList, true);
		// 'Bd' is matched as a weight keyword so stripped entirely
		expect(result.trim()).toBe('');
	});
});

// ---------------------------------------------------------------------------
// formatFontTitle
// ---------------------------------------------------------------------------

describe('formatFontTitle', () => {
	it('replaces hyphens with spaces', () => {
		expect(formatFontTitle('MyFont-Bold', true)).toBe('MyFont Bold');
	});

	it('title-cases each word', () => {
		expect(formatFontTitle('myfont bold', true)).toBe('Myfont Bold');
	});

	it('collapses multiple spaces', () => {
		expect(formatFontTitle('MyFont  Bold', true)).toBe('MyFont Bold');
	});

	it('expands abbreviations when preserveShortenedNames is false', () => {
		// 'Bd' should expand to 'Bold'
		expect(formatFontTitle('MyFont Bd', false)).toBe('MyFont Bold');
	});

	it('preserves abbreviations when preserveShortenedNames is true', () => {
		expect(formatFontTitle('MyFont Bd', true)).toBe('MyFont Bd');
	});

	it('normalises "Italic" capitalisation regardless of preserve flag', () => {
		expect(formatFontTitle('MyFont italic', true)).toBe('MyFont Italic');
	});
});

// ---------------------------------------------------------------------------
// addItalicToFontTitle
// ---------------------------------------------------------------------------

describe('addItalicToFontTitle', () => {
	it('appends "Italic" when the font has a non-zero italic angle', () => {
		const font = mockFont({ italicAngle: -12, fullName: 'MyFont Bold' });
		const result = addItalicToFontTitle(font, 'MyFont Bold', [], 'Italic');
		expect(result).toBe('MyFont Bold Italic');
	});

	it('does not duplicate "Italic" when already in the title', () => {
		const font = mockFont({ italicAngle: -12, fullName: 'MyFont Bold Italic' });
		const result = addItalicToFontTitle(font, 'MyFont Bold Italic', ['Italic'], 'Italic');
		expect(result).toBe('MyFont Bold Italic');
	});

	it('does not append italic keywords to an upright font', () => {
		const font = mockFont({ italicAngle: 0, fullName: 'MyFont Bold' });
		const result = addItalicToFontTitle(font, 'MyFont Bold', [], 'Regular');
		expect(result).toBe('MyFont Bold');
	});

	it('appends detected italic keyword from italicKW list', () => {
		const font = mockFont({ italicAngle: 0, fullName: 'MyFont Bold Oblique' });
		const result = addItalicToFontTitle(font, 'MyFont Bold', ['Oblique'], 'Italic');
		expect(result).toBe('MyFont Bold Oblique');
	});
});

// ---------------------------------------------------------------------------
// determineWeight
// ---------------------------------------------------------------------------

describe('determineWeight', () => {
	it('reads usWeightClass from the OS/2 table when available', () => {
		const font = mockFont({ usWeightClass: 600 });
		expect(determineWeight(font, 'SemiBold')).toBe(600);
	});

	it('maps weight names to CSS weight values when OS/2 is absent', () => {
		const font = mockFont();
		expect(determineWeight(font, 'Bold')).toBe(700);
		expect(determineWeight(font, 'Light')).toBe(300);
		expect(determineWeight(font, 'Regular')).toBe(400);
		expect(determineWeight(font, 'Medium')).toBe(500);
		expect(determineWeight(font, 'Black')).toBe(900);
		expect(determineWeight(font, 'SemiBold')).toBe(600);
		expect(determineWeight(font, 'ExtraBold')).toBe(800);
		expect(determineWeight(font, 'Thin')).toBe(200);
		expect(determineWeight(font, 'Hairline')).toBe(100);
	});

	it('defaults to 400 for unrecognised weight names', () => {
		const font = mockFont();
		expect(determineWeight(font, 'Display')).toBe(400);
		expect(determineWeight(font, '')).toBe(400);
	});

	it('is case-insensitive for weight name matching', () => {
		const font = mockFont();
		expect(determineWeight(font, 'BOLD')).toBe(700);
		expect(determineWeight(font, 'light')).toBe(300);
	});
});

// ---------------------------------------------------------------------------
// sortFontObjects
// ---------------------------------------------------------------------------

describe('sortFontObjects', () => {
	it('sorts font objects by ascending weight', () => {
		const fonts = {
			bold: { weight: 700, style: 'Regular' },
			light: { weight: 300, style: 'Regular' },
			regular: { weight: 400, style: 'Regular' },
		};
		const sorted = sortFontObjects(fonts);
		const weights = Object.values(sorted).map(f => f.weight);
		expect(weights).toEqual([300, 400, 700]);
	});

	it('places Regular before Italic at equal weights', () => {
		const fonts = {
			boldItalic: { weight: 700, style: 'Italic' },
			bold: { weight: 700, style: 'Regular' },
		};
		const sorted = sortFontObjects(fonts);
		const styles = Object.values(sorted).map(f => f.style);
		expect(styles[0]).toBe('Regular');
		expect(styles[1]).toBe('Italic');
	});

	it('returns an object with the same keys', () => {
		const fonts = {
			a: { weight: 400, style: 'Regular' },
			b: { weight: 200, style: 'Regular' },
		};
		const sorted = sortFontObjects(fonts);
		expect(Object.keys(sorted).sort()).toEqual(['a', 'b']);
	});

	it('handles a single font gracefully', () => {
		const fonts = { only: { weight: 400, style: 'Regular' } };
		expect(sortFontObjects(fonts)).toEqual(fonts);
	});
});

// ---------------------------------------------------------------------------
// createFontObject
// ---------------------------------------------------------------------------

describe('createFontObject', () => {
	it('returns a font object with all required fields', () => {
		const font = mockFont({ usWeightClass: 700, fullName: 'MyFont Bold' });
		const file = new File([''], 'MyFont-Bold.ttf');
		const obj = createFontObject('myfont-bold', 'MyFont Bold', 'MyFont', font, false, 'Bold', '', file, null);

		expect(obj).toMatchObject({
			_id: 'myfont-bold',
			title: 'MyFont Bold',
			typefaceName: 'MyFont',
			style: 'Regular',
			variableFont: false,
			weightName: 'Bold',
			subfamily: '',
			normalWeight: true,
			weight: 700,
			fileInput: {},
		});
		expect(typeof obj._key).toBe('string');
		expect(obj._key.length).toBeGreaterThan(0);
		expect(obj.files).toHaveLength(1);
	});

	it('marks the font as Italic when the font has a non-zero italic angle', () => {
		const font = mockFont({ italicAngle: -12, fullName: 'MyFont Bold Italic' });
		const file = new File([''], 'MyFont-Bold-Italic.ttf');
		const obj = createFontObject('myfont-bold-italic', 'MyFont Bold Italic', 'MyFont', font, false, 'Bold', '', file, null);
		expect(obj.style).toBe('Italic');
	});

	it('stores originalFilename when provided', () => {
		const font = mockFont({ fullName: 'MyFont Bold' });
		const file = new File([''], 'MyFont-Bold.ttf');
		const obj = createFontObject('myfont-bold', 'MyFont Bold', 'MyFont', font, false, 'Bold', '', file, 'MyFont-Bold');
		expect(obj.originalFilename).toBe('MyFont-Bold');
	});

	it('omits originalFilename when null', () => {
		const font = mockFont({ fullName: 'MyFont Bold' });
		const file = new File([''], 'MyFont-Bold.ttf');
		const obj = createFontObject('myfont-bold', 'MyFont Bold', 'MyFont', font, false, 'Bold', '', file, null);
		expect(obj).not.toHaveProperty('originalFilename');
	});
});
