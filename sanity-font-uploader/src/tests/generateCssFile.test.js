// Tests for generateCssFile utility — buildVFDescriptors variable font axis logic
import { describe, it, expect } from 'vitest';
import { buildVFDescriptors } from '../utils/generateCssFile';

/** Builds a minimal fontkit-shaped mock with variationAxes */
function mockVFFont(axes) {
	return { variationAxes: axes };
}

describe('buildVFDescriptors', () => {
	it('returns empty descriptors and skipped for a font with no axes', () => {
		const { descriptors, skipped } = buildVFDescriptors({ variationAxes: null });
		expect(descriptors).toBe('');
		expect(skipped).toEqual([]);
	});

	it('maps wght axis to font-weight descriptor', () => {
		const font = mockVFFont({ wght: { min: 100, max: 900 } });
		const { descriptors } = buildVFDescriptors(font);
		expect(descriptors).toContain('font-weight:100 900');
	});

	it('maps wdth axis to font-stretch descriptor', () => {
		const font = mockVFFont({ wdth: { min: 75, max: 125 } });
		const { descriptors } = buildVFDescriptors(font);
		expect(descriptors).toContain('font-stretch:75% 125%');
	});

	it('maps slnt axis to oblique font-style descriptor in ascending order', () => {
		const font = mockVFFont({ slnt: { min: -12, max: 0 } });
		const { descriptors } = buildVFDescriptors(font);
		expect(descriptors).toContain('font-style:oblique -12deg 0deg');
	});

	it('maps ital axis to italic when max > 0', () => {
		const font = mockVFFont({ ital: { min: 0, max: 1 } });
		const { descriptors } = buildVFDescriptors(font);
		expect(descriptors).toContain('font-style:italic');
	});

	it('skips ital axis when max === 0', () => {
		const font = mockVFFont({ ital: { min: 0, max: 0 } });
		const { descriptors, skipped } = buildVFDescriptors(font);
		expect(descriptors).not.toContain('font-style');
		expect(skipped).toContain('ital');
	});

	it('slnt takes priority over ital when both present', () => {
		const font = mockVFFont({ ital: { min: 0, max: 1 }, slnt: { min: -12, max: 0 } });
		const { descriptors } = buildVFDescriptors(font);
		expect(descriptors).toContain('oblique');
		expect(descriptors).not.toContain('font-style:italic');
	});

	it('skips degenerate axes where min === max', () => {
		const font = mockVFFont({ wght: { min: 400, max: 400 } });
		const { descriptors, skipped } = buildVFDescriptors(font);
		expect(descriptors).not.toContain('font-weight');
		expect(skipped).toContain('wght');
	});

	it('clamps axes where min > max', () => {
		const font = mockVFFont({ wght: { min: 900, max: 100 } });
		const { descriptors } = buildVFDescriptors(font);
		expect(descriptors).toContain('font-weight:100 900');
	});

	it('puts unknown axes (opsz, GRAD, custom) in the skipped list', () => {
		const font = mockVFFont({ opsz: { min: 8, max: 144 }, GRAD: { min: -200, max: 150 } });
		const { skipped } = buildVFDescriptors(font);
		expect(skipped).toContain('opsz');
		expect(skipped).toContain('GRAD');
	});

	it('handles multiple standard axes together', () => {
		const font = mockVFFont({ wght: { min: 100, max: 900 }, wdth: { min: 75, max: 125 } });
		const { descriptors } = buildVFDescriptors(font);
		expect(descriptors).toContain('font-weight:100 900');
		expect(descriptors).toContain('font-stretch:75% 125%');
	});

	it('returns empty descriptors when variationAxes throws', () => {
		const font = { get variationAxes() { throw new Error('corrupt font'); } };
		const { descriptors, skipped } = buildVFDescriptors(font);
		expect(descriptors).toBe('');
		expect(skipped).toEqual([]);
	});
});
