# Active Context - Liiift Sanity Tools

## Current Work Focus

### Primary Package: sanity-font-uploader v2.0.6
The `sanity-font-uploader` package has been fully overhauled, tested, and published. It is integrated into Darden Studio (staging) and is pending integration into TDF and MCKL after Darden testing is complete.

## Recent Work (April 2026)

### sanity-font-uploader — v2.0.0 → v2.0.6 (complete)

**Architecture:** Full rewrite from single-file monolith to modular package with separate components, utils, and hooks.

**Bug fixes applied (v2.0.0–v2.0.4):**
- GROQ injection in `generateFontData.js` — switched to parameterized queries
- `value` vs `fileInput` confusion in `SingleUploaderTool.jsx` — Build, Delete, and Regenerate buttons reading from wrong variable
- Missing `reverseSpellingLookup` import in `UploadScriptsComponent.jsx`
- `id` referenced before `let id = slugify(...)` in `UploadScriptsComponent.jsx`
- `.length` check on an object in `FontScriptUploaderComponent.jsx`
- `'prices'` typo → `'price'` in `BatchUploadFonts.jsx`
- `return -1` → `throw err` in `generateCssFile.js` catch block
- `determineWeight` regex ordering — `extra bold|extrabold` now checked before `bold`
- `style` not passed to `generateCssFile` in `SingleUploaderTool.jsx`

**UI overhaul (v2.0.5–v2.0.6):**
- `SingleUploaderTool` — Card-bordered rows per format, monospace labels, TrashIcon delete, ghost Upload/Build buttons, fixed `value→fileInput` bugs in CSS and Data rows
- `StatusDisplay` — Returns null when idle, uses Card tone
- `UploadButton` — Dashed drop-zone with UploadIcon, shortened subtitle
- `BatchUploadFonts` — Removed Grid wrappers, Switch+Label+description grouped via Flex/Stack, utilities sections in bordered Cards, spinners show live status string
- `RegenerateSubfamiliesComponent` — Uses StatusDisplay, shows Spinner during processing instead of just disabling the button
- `FontScriptUploaderComponent` — Full rewrite: `value[language]→scriptFileInput[language]` bug fixed (Build/Delete/Regenerate were never visible), `renderFormatRow()` extracted, dead `expanded` state removed, 6 debug logs removed, language header message truncated with ellipsis
- `UploadScriptsComponent` — Full rewrite: 24 debug logs removed, 5 unused imports removed, `StatusDisplay` added, dashed drop-zone replaces old label+button pattern, script select has Label, spinner shows live status
- `PriceInput` — `Label` above input, `Stack` layout, removed dead `Box` wrapper and `weight=""`
- Cross-component consistency: all spinners use horizontal layout showing live `status`, `Spinner center` prop removed, language header `size={1}` added, `RegenerateSubfamiliesComponent` spinner added
- Responsivity: `FontScriptUploaderComponent` language header message now truncates with ellipsis and `flexShrink: 0` on the name

**Tests added:** 92 tests across 4 files in `src/tests/` — all pass on every build

**Package hygiene:**
- `files` field narrowed to exclude `src/tests/` from tarball
- `repository.url` normalised, README written, `link:*` dev scripts added

**Published:** v2.0.6 on npm as `@liiift-studio/sanity-font-uploader`

### Consumer repo state
| Repo | Branch | Version | Merged to staging |
|---|---|---|---|
| `sites/darden/sanity` | `feature/font-uploader-v2` | `^2.0.6` | ✅ Yes |
| `sites/tdf/sanity` | `feature/font-uploader-v2` | `^2.0.6` | ❌ Holding — test in Darden first |
| `sites/mckl/cms` | `feature/font-uploader-v2` | `^2.0.6` | ❌ Holding — test in Darden first |
| `tools/sanity-tools` | `feature/font-uploader-v2` | v2.0.6 | ❌ Not yet merged to main |

## Active Decisions

- Darden Studio is the testing ground for v2 integration — waiting on smoke test before merging TDF and MCKL
- `SANITY_STUDIO_SITE_URL` is a required env var for font format conversion (calls `/api/sanity/fontWorker`)
- Tests run on every `npm run build` and `prepublishOnly` — gates bad publishes

## Next Steps

1. **Smoke test** Darden Studio (staging) — verify Build, delete, Regenerate, batch upload, CSS generation
2. **Merge TDF and MCKL** into staging once Darden testing passes
3. **Merge darden `feature/font-uploader-v2` into `main`**
4. **Merge sanity-tools `feature/font-uploader-v2` into `main`**
