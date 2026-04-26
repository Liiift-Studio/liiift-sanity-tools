// Tests for generateFontData utility — buildFontMetadata metadata and metrics extraction
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildFontMetadata } from '../utils/generateFontData';

/** Builds a minimal fontkit-shaped mock font */
function mockFont(overrides = {}) {
	return {
		postscriptName: 'MyFont-Regular',
		fullName: 'MyFont Regular',
		familyName: 'MyFont',
		subfamilyName: 'Regular',
		copyright: 'Copyright 2024 MyFoundry',
		version: 'Version 1.005',
		unitsPerEm: 1000,
		ascent: 800,
		descent: -200,
		lineGap: 0,
		underlinePosition: -75,
		underlineThickness: 50,
		italicAngle: 0,
		capHeight: 660,
		xHeight: 480,
		bbox: { minX: -10, minY: -200, maxX: 1000, maxY: 800 },
		...overrides,
	};
}

describe('buildFontMetadata', () => {
	let dateSpy;

	beforeEach(() => {
		dateSpy = vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-01T00:00:00.000Z');
	});

	afterEach(() => {
		dateSpy.mockRestore();
	});

	it('extracts postscriptName, fullName, familyName, subfamilyName, copyright', () => {
		const { metaData } = buildFontMetadata(mockFont());
		expect(metaData.postscriptName).toBe('MyFont-Regular');
		expect(metaData.fullName).toBe('MyFont Regular');
		expect(metaData.familyName).toBe('MyFont');
		expect(metaData.subfamilyName).toBe('Regular');
		expect(metaData.copyright).toBe('Copyright 2024 MyFoundry');
	});

	it('strips "Version " prefix from version string', () => {
		const { metaData } = buildFontMetadata(mockFont({ version: 'Version 2.001' }));
		expect(metaData.version).toBe('2.001');
	});

	it('handles version strings that already lack the "Version " prefix', () => {
		const { metaData } = buildFontMetadata(mockFont({ version: '1.005' }));
		expect(metaData.version).toBe('1.005');
	});

	it('handles null/undefined version gracefully', () => {
		const { metaData } = buildFontMetadata(mockFont({ version: null }));
		expect(metaData.version).toBe('');
	});

	it('sets genDate to the current ISO timestamp', () => {
		const { metaData } = buildFontMetadata(mockFont());
		expect(metaData.genDate).toBe('2024-01-01T00:00:00.000Z');
	});

	it('extracts all metric fields', () => {
		const { metrics } = buildFontMetadata(mockFont());
		expect(metrics.unitsPerEm).toBe(1000);
		expect(metrics.ascender).toBe(800);
		expect(metrics.descender).toBe(-200);
		expect(metrics.lineGap).toBe(0);
		expect(metrics.underlinePosition).toBe(-75);
		expect(metrics.underlineThickness).toBe(50);
		expect(metrics.italicAngle).toBe(0);
		expect(metrics.capHeight).toBe(660);
		expect(metrics.xHeight).toBe(480);
	});

	it('passes boundingBox through as-is', () => {
		const bbox = { minX: -50, minY: -250, maxX: 1100, maxY: 850 };
		const { metrics } = buildFontMetadata(mockFont({ bbox }));
		expect(metrics.boundingBox).toEqual(bbox);
	});
});
