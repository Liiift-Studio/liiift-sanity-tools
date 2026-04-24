// Tests for sanitizeForSanityId — ensures output is always a valid Sanity document ID
import { describe, it, expect } from 'vitest';
import { sanitizeForSanityId } from '../utils/sanitizeForSanityId';

/** Regex that describes a valid Sanity document ID */
const VALID_ID = /^[a-z_][a-z0-9\-_]*$/;

describe('sanitizeForSanityId', () => {
	it('lowercases and hyphenates a normal font name', () => {
		expect(sanitizeForSanityId('My Font')).toBe('my-font');
		expect(sanitizeForSanityId('Futura Light')).toBe('futura-light');
	});

	it('replaces + with "plus"', () => {
		expect(sanitizeForSanityId('Font+Name')).toBe('fontplusname');
		expect(sanitizeForSanityId('Plus+One')).toBe('plusplusone');
	});

	it('replaces & with "and"', () => {
		expect(sanitizeForSanityId('Sans & Serif')).toBe('sans-and-serif');
	});

	it('replaces @ with "at"', () => {
		expect(sanitizeForSanityId('Font@Type')).toBe('fontattype');
	});

	it('strips characters that are not lowercase-alphanumeric, hyphens, or underscores', () => {
		expect(sanitizeForSanityId('Font!Name')).toBe('fontname');
		expect(sanitizeForSanityId('Font(Name)')).toBe('fontname');
	});

	it('prepends "font_" when the result starts with a number', () => {
		expect(sanitizeForSanityId('123Font')).toBe('font_123font');
		expect(sanitizeForSanityId('4Ever')).toBe('font_4ever');
	});

	it('returns a fallback starting with "font-" for falsy input', () => {
		expect(sanitizeForSanityId('')).toMatch(/^font-\d+$/);
		expect(sanitizeForSanityId(null)).toMatch(/^font-\d+$/);
		expect(sanitizeForSanityId(undefined)).toMatch(/^font-\d+$/);
	});

	it('returns a fallback for non-string input', () => {
		expect(sanitizeForSanityId(42)).toMatch(/^font-\d+$/);
		expect(sanitizeForSanityId({})).toMatch(/^font-\d+$/);
	});

	it('collapses repeated hyphens', () => {
		const result = sanitizeForSanityId('Font---Name');
		expect(result).toBe('font-name');
	});

	it('strips leading and trailing hyphens', () => {
		const result = sanitizeForSanityId('-Font-');
		expect(VALID_ID.test(result)).toBe(true);
		expect(result).not.toMatch(/^-/);
		expect(result).not.toMatch(/-$/);
	});

	it('truncates strings longer than 128 characters and appends a short hash', () => {
		const long = 'abcdefghij'.repeat(14); // 140 chars
		const result = sanitizeForSanityId(long);
		expect(result.length).toBeLessThanOrEqual(128);
		expect(VALID_ID.test(result)).toBe(true);
	});

	it('always returns a string that passes the Sanity ID regex', () => {
		const inputs = [
			'My Font Bold',
			'123abc',
			'Font & Name',
			'Font+Bold',
			'__reserved__',
			'a',
			'Helvetica Neue LT Pro 55 Roman',
		];
		inputs.forEach(input => {
			const result = sanitizeForSanityId(input);
			expect(VALID_ID.test(result)).toBe(true);
		});
	});

	it('handles strings with only invalid characters by returning a fallback', () => {
		// After stripping all chars, sanitized becomes '' → fallback
		const result = sanitizeForSanityId('!!!');
		expect(VALID_ID.test(result)).toBe(true);
	});

	it('trims leading/trailing whitespace before processing', () => {
		expect(sanitizeForSanityId('  my font  ')).toBe('my-font');
	});
});
