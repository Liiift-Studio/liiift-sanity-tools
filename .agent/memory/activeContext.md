# Active Context - Liiift Sanity Tools

## Current Work Focus

### Primary Package: sanity-font-uploader v2.0.5
The `sanity-font-uploader` package has been fully overhauled, tested, and published. It is integrated into Darden Studio (staging) and is pending integration into TDF and MCKL after Darden testing is complete.

## Recent Work (April 2026)

### sanity-font-uploader — v2.0.0 → v2.0.5 (complete)

**Architecture:** Full rewrite from single-file monolith to modular package with separate components, utils, and hooks.

**Bug fixes applied (v2.0.0–v2.0.4):**
- GROQ injection in `generateFontData.js` — switched to parameterized queries
- `value` vs `fileInput` confusion in `SingleUploaderTool.jsx` — Build, Delete, and Regenerate buttons were reading from the wrong variable
- Missing `reverseSpellingLookup` import in `UploadScriptsComponent.jsx`
- `id` referenced before `let id = slugify(...)` in `UploadScriptsComponent.jsx`
- `.length` check on an object in `FontScriptUploaderComponent.jsx`
- `'prices'` typo → `'price'` in `BatchUploadFonts.jsx` (spinner never showed)
- `return -1` → `throw err` in `generateCssFile.js` catch block
- `determineWeight` regex ordering — `extra bold|extrabold` now checked before `bold`
- `style` not passed to `generateCssFile` in `SingleUploaderTool.jsx`
- `console.log` → `console.error` in error paths across multiple utils

**UI overhaul (v2.0.5):**
- `SingleUploaderTool.jsx` — Card-bordered rows per font format, monospace format labels, TrashIcon delete buttons, ghost Upload buttons, extracted `renderCssSection()` and `renderDataSection()` fixing remaining `value→fileInput` bugs
- `StatusDisplay.jsx` — Returns null when idle, uses Card tone instead of inline styles
- `UploadButton.jsx` — Dashed-border drop zone with UploadIcon and centered descriptive text

**Tests added:** 92 tests across 4 files in `src/tests/`
- `generateKeywords.test.js` — reverseSpellingLookup, expandAbbreviations, removeWeightNames, generateStyleKeywords
- `sanitizeForSanityId.test.js` — all edge cases including symbols, number-start, long strings, fallbacks
- `processFontFiles.test.js` — extractWeightName, extractWeightFromFullName, processSubfamilyName, formatFontTitle, addItalicToFontTitle, determineWeight, sortFontObjects, createFontObject
- `updateTypefaceDocument.test.js` — subfamily grouping, deduplication, VF skipping, patch assembly, preferredStyle promotion, draft/published patching, error handling

**Package hygiene:**
- `files` field narrowed to exclude `src/tests/` from tarball
- `repository.url` normalised via `npm pkg fix`
- README written — installation, components, full schema field reference, env vars, link scripts
- `link:darden`, `link:tdf`, `link:mckl`, `link:all` scripts added for local symlink dev

**Published:** v2.0.5 on npm as `@liiift-studio/sanity-font-uploader`

### Consumer repo state
| Repo | Branch | Version | Merged to staging |
|---|---|---|---|
| `sites/darden/sanity` | `feature/font-uploader-v2` | `^2.0.5` | ✅ Yes |
| `sites/tdf/sanity` | `feature/font-uploader-v2` | `^2.0.5` | ❌ Holding — test in Darden first |
| `sites/mckl/cms` | `feature/font-uploader-v2` | `^2.0.5` | ❌ Holding — test in Darden first |
| `tools/sanity-tools` | `feature/font-uploader-v2` | v2.0.5 | ❌ Not yet merged to main |

## Active Decisions

- Darden Studio is the testing ground for v2 integration — waiting on smoke test before merging TDF and MCKL
- `SANITY_STUDIO_SITE_URL` is a required env var for font format conversion (calls `/api/sanity/fontWorker`) — must be set in each consumer studio's Vercel environment
- Tests run on every `npm run build` and `prepublishOnly` — this is intentional to gate bad publishes

## Next Steps

1. **Smoke test** the font uploader in Darden Studio (staging) — verify Build button, delete, Regenerate, batch upload, CSS generation
2. **Merge TDF and MCKL** into staging once Darden testing passes
3. **Merge darden `feature/font-uploader-v2` into `main`** — currently only in staging
4. **Merge sanity-tools `feature/font-uploader-v2` into `main`** — currently unpublished to main
