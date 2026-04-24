# @liiift-studio/sanity-font-uploader

Batch font uploader plugin for Sanity Studio. Handles multi-format upload, format conversion, font metadata extraction, CSS `@font-face` generation, variable font support, and script variant management.

Compatible with Sanity v3, v4, and v5.

---

## Installation

```bash
npm install @liiift-studio/sanity-font-uploader
```

### Peer dependencies

```bash
npm install sanity @sanity/ui @sanity/icons react
```

| Peer | Required version |
|---|---|
| `sanity` | `>=3` |
| `@sanity/ui` | `>=3` |
| `@sanity/icons` | `>=3` |
| `react` | `>=18` |

If you hit peer dependency conflicts (e.g. a plugin that requires `@sanity/icons ^2`), add `legacy-peer-deps=true` to your `.npmrc`.

---

## Components

### `BatchUploadFonts`

Drop-zone batch uploader. Processes multiple font files at once, extracts metadata from each, and creates individual Sanity font documents.

```jsx
import { BatchUploadFonts } from '@liiift-studio/sanity-font-uploader';

// Used as a Sanity custom input component
export const typefaceSchema = {
  name: 'typeface',
  type: 'document',
  fields: [
    {
      name: 'styles',
      type: 'object',
      components: { input: BatchUploadFonts },
      fields: [ /* see Schema fields below */ ],
    },
  ],
};
```

### `SingleUploaderTool`

Handles individual font format uploads (TTF, OTF, WOFF2, WOFF, EOT, SVG) for a single font document. Builds derived formats (e.g. WOFF2 from TTF) and regenerates CSS on upload.

```jsx
import { SingleUploaderTool } from '@liiift-studio/sanity-font-uploader';

// Used as a custom input on a font document field
{
  name: 'fileInput',
  type: 'object',
  components: { input: SingleUploaderTool },
  fields: [ /* format fields — see Schema fields below */ ],
}
```

### `UploadScriptsComponent` / `FontScriptUploaderComponent`

Upload font files scoped to a specific script variant (e.g. Latin, Greek, Arabic). Controlled by the `SANITY_STUDIO_SCRIPTS` environment variable.

### `RegenerateSubfamiliesComponent`

Utility component for re-deriving subfamily structure from existing font documents without re-uploading files.

---

## Schema fields

The plugin reads and writes the following fields. Your Sanity schema must include these fields for the components to work correctly.

### Font document (`font`)

| Field | Type | Written by | Description |
|---|---|---|---|
| `title` | `string` | `BatchUploadFonts`, `SingleUploaderTool` | Full font name (e.g. `MyFont SemiBold Italic`) |
| `slug` | `slug` | `BatchUploadFonts` | Sanitized document ID as a slug (`current` = document `_id`) |
| `typefaceName` | `string` | `BatchUploadFonts` | Name of the parent typeface |
| `style` | `string` | `BatchUploadFonts`, `SingleUploaderTool` | `'Regular'` or `'Italic'` |
| `weight` | `number` | `BatchUploadFonts` | Numeric CSS weight (100–900) |
| `weightName` | `string` | `BatchUploadFonts` | Human-readable weight name (e.g. `'SemiBold'`) |
| `subfamily` | `string` | `BatchUploadFonts` | Subfamily name (e.g. `'Condensed'`) |
| `variableFont` | `boolean` | `BatchUploadFonts` | `true` for variable fonts |
| `normalWeight` | `boolean` | `BatchUploadFonts` | Always `true` on creation |
| `fileInput` | `object` | `SingleUploaderTool` | Container for all uploaded format files |
| `fileInput.ttf` | `file` | `SingleUploaderTool` | Uploaded TTF file (Sanity asset reference) |
| `fileInput.otf` | `file` | `SingleUploaderTool` | Uploaded OTF file |
| `fileInput.woff2` | `file` | `SingleUploaderTool` | WOFF2 file (built from TTF or uploaded directly) |
| `fileInput.woff` | `file` | `SingleUploaderTool` | WOFF file |
| `fileInput.eot` | `file` | `SingleUploaderTool` | EOT file |
| `fileInput.svg` | `file` | `SingleUploaderTool` | SVG font file |
| `fileInput.css` | `file` | `SingleUploaderTool` | Generated `@font-face` CSS file |

### Typeface document (`typeface`)

| Field | Type | Written by | Description |
|---|---|---|---|
| `styles.fonts` | `array<reference>` | `BatchUploadFonts` | References to regular font documents |
| `styles.variableFont` | `array<reference>` | `BatchUploadFonts` | References to variable font documents |
| `styles.subfamilies` | `array<object>` | `BatchUploadFonts` | Subfamily groups — each has `title`, `_key`, `_type: 'object'`, and `fonts: array<reference>` |
| `preferredStyle` | `reference` | `BatchUploadFonts` | Reference to the preferred regular-weight font document |

### Script variant fields (optional)

When `SANITY_STUDIO_SCRIPTS` is set, `UploadScriptsComponent` and `FontScriptUploaderComponent` write per-script font file references using the same format as `fileInput` but keyed by script name.

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `SANITY_STUDIO_SCRIPTS` | No | Comma-separated list of script variant names (e.g. `latin,greek,arabic`). Controls which script tabs appear in the upload UI. |

---

## Utilities

All utility functions are exported for use outside of the components:

```js
import {
  // Font processing
  processFontFiles,
  extractFontMetadata,
  extractWeightName,
  extractWeightFromFullName,
  processSubfamilyName,
  formatFontTitle,
  addItalicToFontTitle,
  determineWeight,
  sortFontObjects,
  createFontObject,
  sanitizeForSanityId,

  // Keyword helpers
  generateStyleKeywords,
  reverseSpellingLookup,
  expandAbbreviations,
  removeWeightNames,

  // Document patching
  updateTypefaceDocument,
  updateFontPrices,
  renameFontDocuments,
  uploadFontFiles,

  // CSS + file generation
  generateCssFile,
  generateFontFile,
  generateFontData,
  generateSubset,
  parseVariableFontInstances,
} from '@liiift-studio/sanity-font-uploader';
```

---

## Local development

To use the local source instead of the published npm package, symlink it into a foundry repo:

```bash
# From the sanity-font-uploader directory:
npm run link:darden   # symlink into Darden Studio
npm run link:tdf      # symlink into The Designers Foundry
npm run link:mckl     # symlink into MCKL CMS
npm run link:all      # symlink into all three at once
```

Then in a separate terminal, run the watch build so the symlinked consumers pick up changes live:

```bash
npm run dev
```

To restore the published package in a consumer repo, run `npm install` inside that repo (with `--legacy-peer-deps` for TDF).

---

## License

MIT — [Liiift Studio](https://github.com/Liiift-Studio)
