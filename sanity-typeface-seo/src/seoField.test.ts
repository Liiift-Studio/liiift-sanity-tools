/** Unit tests for seoField and seoFieldWithLinks */
import { describe, it, expect } from 'vitest'
import { seoField } from './seoField'
import { seoFieldWithLinks } from './seoFieldWithLinks'

const SHARED_FIELD_NAMES = ['title', 'keywords', 'image', 'description']

describe('seoField', () => {
	it('has correct field identity', () => {
		expect(seoField.name).toBe('social')
		expect(seoField.type).toBe('object')
		expect(seoField.title).toBe('SEO')
	})

	it('is collapsible but not collapsed by default', () => {
		expect(seoField.options.collapsible).toBe(true)
		expect((seoField.options as any).collapsed).toBeUndefined()
	})

	it('contains all expected fields', () => {
		const names = seoField.fields.map(f => f.name)
		for (const name of SHARED_FIELD_NAMES) {
			expect(names).toContain(name)
		}
	})

	it('image field uses cloudinary asset type', () => {
		const imageField = seoField.fields.find(f => f.name === 'image')
		expect(imageField?.type).toBe('cloudinary.asset')
	})

	it('description field is text type', () => {
		const descField = seoField.fields.find(f => f.name === 'description')
		expect(descField?.type).toBe('text')
	})

	it('has exactly 4 fields', () => {
		expect(seoField.fields).toHaveLength(4)
	})
})

describe('seoFieldWithLinks', () => {
	it('has same field identity as seoField', () => {
		expect(seoFieldWithLinks.name).toBe('social')
		expect(seoFieldWithLinks.type).toBe('object')
		expect(seoFieldWithLinks.title).toBe('SEO')
	})

	it('is collapsible but not collapsed by default', () => {
		expect(seoFieldWithLinks.options.collapsible).toBe(true)
		expect((seoFieldWithLinks.options as any).collapsed).toBeUndefined()
	})

	it('contains all base seoField fields', () => {
		const names = seoFieldWithLinks.fields.map(f => f.name)
		for (const name of SHARED_FIELD_NAMES) {
			expect(names).toContain(name)
		}
	})

	it('adds adobeLink and fontStandLink fields', () => {
		const names = seoFieldWithLinks.fields.map(f => f.name)
		expect(names).toContain('adobeLink')
		expect(names).toContain('fontStandLink')
	})

	it('marketplace link fields are string type', () => {
		const adobe = seoFieldWithLinks.fields.find(f => f.name === 'adobeLink')
		const fontStand = seoFieldWithLinks.fields.find(f => f.name === 'fontStandLink')
		expect(adobe?.type).toBe('string')
		expect(fontStand?.type).toBe('string')
	})

	it('is a superset of seoField — has 2 more fields', () => {
		expect(seoFieldWithLinks.fields.length).toBe(seoField.fields.length + 2)
	})
})
