/** Utility to extract SEO meta tags from a raw HTML string — use in /api/seo-scan route handlers */
import type { SeoScanResult } from './types'

/** Extracts the first regex capture group from html, or null */
function capture(html: string, pattern: RegExp): string | null {
	const match = pattern.exec(html)
	return match?.[1]?.trim() || null
}

/** Extracts a <meta name="..."> content value, handling both attribute orderings */
function metaName(html: string, name: string): string | null {
	return (
		capture(html, new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i')) ??
		capture(html, new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i'))
	)
}

/** Extracts a <meta property="og:..."> content value, handling both attribute orderings */
function metaOg(html: string, property: string): string | null {
	return (
		capture(html, new RegExp(`<meta[^>]+property=["']og:${property}["'][^>]+content=["']([^"']+)["']`, 'i')) ??
		capture(html, new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${property}["']`, 'i'))
	)
}

/** Parses SEO-relevant meta tags from a raw HTML string — safe to call in any Node.js context */
export function parseSeoFromHtml(html: string): SeoScanResult {
	return {
		title: capture(html, /<title[^>]*>([^<]+)<\/title>/i),
		description: metaName(html, 'description'),
		keywords: metaName(html, 'keywords'),
		ogTitle: metaOg(html, 'title'),
		ogDescription: metaOg(html, 'description'),
		ogImage: metaOg(html, 'image'),
	}
}
