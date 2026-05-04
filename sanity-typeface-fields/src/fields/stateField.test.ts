/** Unit tests for createStateField() factory */
import { describe, it, expect } from 'vitest'
import { createStateField } from './stateField'

describe('createStateField', () => {
	it('returns correct field name and type', () => {
		const field = createStateField()
		expect(field.name).toBe('state')
		expect(field.type).toBe('string')
		expect(field.title).toBe('State')
	})

	it('defaults initialValue to draft', () => {
		expect(createStateField().initialValue).toBe('draft')
	})

	it('defaults publishedValue to published with correct title', () => {
		const field = createStateField()
		const publishedOption = field.options.list.find(o => o.value === 'published')
		expect(publishedOption).toBeDefined()
		expect(publishedOption!.title).toBe('Published ✅')
	})

	it('accepts custom publishedValue — MCKL active variant', () => {
		const field = createStateField({ publishedValue: 'active', publishedTitle: 'Active ✅' })
		const activeOption = field.options.list.find(o => o.value === 'active')
		expect(activeOption).toBeDefined()
		expect(activeOption!.title).toBe('Active ✅')
		expect(field.options.list.find(o => o.value === 'published')).toBeUndefined()
	})

	it('always includes draft, hidden, and archived options', () => {
		const values = createStateField().options.list.map(o => o.value)
		expect(values).toContain('draft')
		expect(values).toContain('hidden')
		expect(values).toContain('archived')
	})

	it('list always has exactly 4 options', () => {
		expect(createStateField().options.list).toHaveLength(4)
		expect(createStateField({ publishedValue: 'active' }).options.list).toHaveLength(4)
	})

	it('validation is a function', () => {
		expect(typeof createStateField().validation).toBe('function')
	})

	it('works with no arguments', () => {
		expect(() => createStateField()).not.toThrow()
	})
})
