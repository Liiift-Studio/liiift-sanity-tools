// Script variant constants (SCRIPTS, SCRIPTS_OBJECT) and HtmlDescription component for the supported script list

import React from 'react'

/** Renders children as-is; used for rich-text fields that return HTML strings */
export const HtmlDescription = ({ children }) => {
	return children || ''
}

/** Script variants available for this studio instance — comma-separated SANITY_STUDIO_SCRIPTS env var */
export const SCRIPTS = (process.env.SANITY_STUDIO_SCRIPTS || '').split(',').map((script) => script.trim()).filter(Boolean);

/** SCRIPTS as Sanity select option objects */
export const SCRIPTS_OBJECT = SCRIPTS.map((script) => {
	return {title: script[0].toUpperCase() + script.slice(1), value: script}
});
