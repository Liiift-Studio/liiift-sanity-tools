// Script variant constants (SCRIPTS, SCRIPTS_OBJECT) and HtmlDescription component for the supported script list

import React from 'react'

/** A Sanity select option object */
interface SelectOption {
	title: string
	value: string
}

/** Props for HtmlDescription */
interface HtmlDescriptionProps {
	children?: React.ReactNode
}

/** Renders children as-is; used for rich-text fields that return HTML strings */
export const HtmlDescription = ({children}: HtmlDescriptionProps): React.ReactNode => {
	return children || ''
}

/** Script variants available for this studio instance — comma-separated SANITY_STUDIO_SCRIPTS env var */
export const SCRIPTS: string[] = (process.env.SANITY_STUDIO_SCRIPTS || '')
	.split(',')
	.map((script) => script.trim())
	.filter(Boolean)

/** SCRIPTS as Sanity select option objects */
export const SCRIPTS_OBJECT: SelectOption[] = SCRIPTS.map((script) => ({
	title: script[0].toUpperCase() + script.slice(1),
	value: script,
}))

/** Discount requirement types — comma-separated SANITY_STUDIO_DISCOUNT_REQ_TYPES env var */
export const DISCOUNT_REQUIREMENT_TYPES: string[] = (
	process.env.SANITY_STUDIO_DISCOUNT_REQ_TYPES || ''
)
	.split(',')
	.map((type) => type.trim())
	.filter(Boolean)

/** DISCOUNT_REQUIREMENT_TYPES as Sanity select option objects */
export const DISCOUNT_REQUIREMENT_TYPES_OBJECT: SelectOption[] = DISCOUNT_REQUIREMENT_TYPES.map(
	(type) => ({
		title: type[0].toUpperCase() + type.slice(1),
		value: type,
	}),
)
