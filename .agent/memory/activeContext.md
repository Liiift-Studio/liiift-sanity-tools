# Active Context — sanity-tools monorepo

Last updated: 2026-04-28

## sanity-font-manager (v2.3.2, branch: feature/studio-version-badge)

All three consumer sites (Darden, TDF, MCKL) are on `^2.3.2` on their `feature/font-uploader-v2` branches. No pending tasks.

## sanity-typeface-fields (v1.1.1, published)

Standalone Sanity field definitions for typeface documents. Exports 11 fields:
- `freeFontField`, `includesSerifField`, `sortHeaviestFirstField`, `buySectionColumnsField`, `fontSizeMultiplierField`
- `createStateField` (factory — MCKL passes `{ publishedValue: 'active' }`)
- `classificationField`, `releaseDateField`, `detailsField`, `specimenField`, `metadataField`

Unit tests added with Vitest (`src/fields/stateField.test.ts`) — 8 tests covering the factory's defaults, MCKL variant, and structure. Run with `npm test`.

## sanity-typeface-seo (v1.2.1, published)

Sanity SEO field definitions + `SeoEvaluatorInput` React component for all foundries.

### Exports
- `seoField` — base SEO object (title, keywords, cloudinary image, description)
- `seoFieldWithLinks` — extends seoField with adobeLink + fontStandLink (Darden only)
- `SeoEvaluatorInput` — default evaluator component (no live scan)
- `createSeoEvaluatorInput(options)` — factory for per-foundry config (siteUrl, urlFromSlug, slugPath)
- `parseSeoFromHtml(html)` — pure utility for API route handlers
- Types: `SeoValue`, `SeoScanResult`, `SeoEvaluatorOptions`

### SeoEvaluatorInput panels
1. **SEO Checklist** — live quality indicators (title 50-60 chars, description 150-160, keywords, image)
2. **Published vs Draft** — always on; fetches published Sanity doc and diffs SEO fields
3. **Live site scan** — opt-in via `siteUrl`; "Scan now" button fetches rendered HTML, compares meta tags to draft

### Consumer wiring
All three foundries use `createSeoEvaluatorInput({ siteUrl: process.env.SANITY_STUDIO_SITE_URL, urlFromSlug })` in their typeface schema. URL patterns:
- Darden: `/typefaces/${slug}`
- TDF: `/typeface/${slug}` (singular)
- MCKL: `/typefaces/${slug}`

`SANITY_STUDIO_SITE_URL` set in all studio env files (dev + production). Each foundry's Next.js site has `/api/seo-scan` route that self-fetches and uses `parseSeoFromHtml`.

Vitest tests: 12 tests in `src/seoField.test.ts`. Run with `npm test`.
