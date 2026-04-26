# @liiift-studio/sanity-font-manager

Full font management suite for Sanity Studio. Handles batch upload, multi-format conversion, metadata extraction, CSS `@font-face` generation, collection and pair generation, and script variant management.

Compatible with Sanity v3, v4, and v5.

---

## Installation

```bash
npm install @liiift-studio/sanity-font-manager
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

If you hit peer dependency conflicts, add `legacy-peer-deps=true` to your `.npmrc`.

---

## Components

### `BatchUploadFonts`

Drag-and-drop batch uploader for a typeface document. Accepts TTF/OTF/WOFF/WOFF2 etc., shows a reviewable file list with count, confirm button, elapsed timer, Wake Lock, and `beforeunload` guard for long uploads. Calls `uploadFontFiles` for each batch.

```jsx
import { BatchUploadFonts } from '@liiift-studio/sanity-font-manager';

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

Per-font file manager inside a font document. Shows TTF/OTF/WOFF/WOFF2/CSS rows always. EOT/SVG/WEB/SUBSET/DATA are hidden behind an advanced toggle (cog icon). Each row has Upload/Build/Delete controls. Handles CSS regeneration, font data extraction, and WEB+SUBSET building via fontWorker.

```jsx
import { SingleUploaderTool } from '@liiift-studio/sanity-font-manager';

{
  name: 'fileInput',
  type: 'object',
  components: { input: SingleUploaderTool },
  fields: [ /* format fields — see Schema fields below */ ],
}
```

### `GenerateCollectionsPairsComponent`

One-click generator for Full Family, Uprights, Italics, and Subfamily collections, plus Regular/Italic pairs matched by weight. Has configurable price inputs for collection-per-font and pair price.

```jsx
import { GenerateCollectionsPairsComponent } from '@liiift-studio/sanity-font-manager';
```

### `FontScriptUploaderComponent`

Script-aware uploader for per-script font file variants (Latin, Arabic, Hebrew, etc.) stored in `scriptFileInput` on the font document.

### `UploadScriptsComponent`

Batch uploader for script-specific font variants across multiple fonts at once.

### `UpdateScriptsComponent`

Updates and re-links existing script font variant references on font documents — used to fix or reassign script variant assignments.

### `RegenerateSubfamiliesComponent`

Recalculates and patches the `subfamily` field on all fonts linked to a typeface, based on the typeface's defined subfamily groups — without re-uploading any files.

### `KeyValueInput`

Generic ordered key-value editor where both keys and values are plain strings. Supports add, remove, and reorder (up/down arrows). Values are stored as an array of `{ key, value }` objects.

```jsx
import { KeyValueInput } from '@liiift-studio/sanity-font-manager';

{
  name: 'aliases',
  type: 'array',
  of: [{ type: 'object', fields: [{ name: 'key', type: 'string' }, { name: 'value', type: 'string' }] }],
  components: { input: KeyValueInput },
}
```

### `KeyValueReferenceInput`

Generic key-value editor where keys are plain strings and values are weak Sanity document references. Supports searching by title via a popover picker, add/remove/reorder, and an optional `topActions` slot for action buttons above the list.

| Prop | Type | Description |
|---|---|---|
| `fetchReferences` | `async (client, doc) => [{_id, title}]` | Async function that returns candidate references for the picker. Receives the Sanity client and the current document. |
| `topActions` | `ReactNode` | Optional content rendered above the key-value rows (e.g. autofill buttons). |
| `referenceType` | `string` | Document type for the created weak references (default: `'font'`). |

```jsx
import { KeyValueReferenceInput } from '@liiift-studio/sanity-font-manager';

{
  name: 'instanceMap',
  type: 'array',
  of: [{ type: 'object', fields: [{ name: 'key', type: 'string' }, { name: 'value', type: 'reference', weak: true, to: [{ type: 'font' }] }] }],
  components: { input: KeyValueReferenceInput },
  // Pass props via options or a wrapper component:
  options: {
    fetchReferences: async (client, doc) => client.fetch('*[_type == "font"]{_id, title}'),
    referenceType: 'font',
  },
}
```

### `VariableInstanceReferencesInput`

Font-specific wrapper around `KeyValueReferenceInput` for mapping variable font instance names to their matching static font documents. Provides:

- A picker filtered to fonts sharing the same `typefaceName`, excluding variable fonts
- **Autofill with Matching** — calls `parseVariableFontInstances` to match instance names to existing font documents by weight/style heuristics
- **Autofill Keys Only** — populates instance name keys from the font's `variableInstances` metadata without resolving references
- Autofill buttons are shown only when the document is a variable font with parsed instance data
- Replace/merge confirmation dialog when pairs already exist

```jsx
import { VariableInstanceReferencesInput } from '@liiift-studio/sanity-font-manager';

{
  name: 'variableInstanceReferences',
  title: 'Variable Font Instances',
  type: 'array',
  hidden: ({ parent }) => !parent.variableFont,
  of: [
    {
      type: 'object',
      fields: [
        { name: 'key', type: 'string', title: 'Instance Name' },
        { name: 'value', type: 'reference', weak: true, to: [{ type: 'font' }], title: 'Matching Font' },
      ],
    },
  ],
  components: { input: VariableInstanceReferencesInput },
}
```

### `StatusDisplay`

Shared status bar used by all components. Shows `Status: [message]` in green on success and red on error, with an optional `action` element slot on the far right (used for the advanced toggle in `SingleUploaderTool`).

```jsx
import { StatusDisplay } from '@liiift-studio/sanity-font-manager';

<StatusDisplay status="ready" error={false} action={<Button ... />} />
```

### `PriceInput`

Reusable `$` + number input for collection and pair price fields.

### `UploadButton`

Label-wrapped button that triggers a hidden file input.

---

## Hook

### `useSanityClient`

Returns the Sanity client instance from the studio context. Used internally by all components.

```js
import { useSanityClient } from '@liiift-studio/sanity-font-manager';

const client = useSanityClient();
```

---

## Utilities

### Font processing

| Export | Description |
|---|---|
| `processFontFiles` | Reads font files via FileReader, parses with fontkit, and builds the `fontsObjects` map used by `uploadFontFiles` |
| `extractFontMetadata` | Extracts weight name, subfamily, style, and variable font flag from a fontkit instance |
| `extractWeightName` | Reads the weight name from fontkit name records, falling back through `preferredSubfamily → fontSubfamily` |
| `extractWeightFromFullName` | Strips the typeface title from the font's full name to isolate the weight/style suffix |
| `processSubfamilyName` | Strips weight and italic keywords from a subfamily string, preserving non-style words like "Condensed" |
| `formatFontTitle` | Normalises a font filename into a human-readable title — expands abbreviations, title-cases, collapses spaces |
| `addItalicToFontTitle` | Appends the detected italic keyword to a title when the font has a non-zero italic angle |
| `determineWeight` | Maps a weight name to a CSS numeric weight, preferring OS/2 `usWeightClass` when available |
| `sortFontObjects` | Sorts a `fontsObjects` map by ascending weight, placing Regular before Italic at equal weights |
| `createFontObject` | Builds the full font object (id, title, weight, style, files, etc.) for a single font file |
| `uploadFontFiles` | Core batch upload orchestrator — uploads each format to Sanity, generates CSS and metadata, then creates or updates font documents |
| `updateTypefaceDocument` | Patches the parent typeface document's `styles.fonts` array with newly uploaded font references |
| `renameFontDocuments` | Renames font document IDs across a typeface when a typeface slug changes |
| `updateFontPrices` | Bulk-updates the `price` field across all font documents linked to a typeface |
| `sanitizeForSanityId` | Converts arbitrary strings into valid Sanity document IDs (lowercase, hyphens, no special characters) |

### CSS and file generation

| Export | Description |
|---|---|
| `generateCssFile` | Builds a `@font-face` CSS file from a WOFF2 blob — URL or base64 `src`, variable font axis descriptors, and metric-tuned fallback `@font-face` for CLS reduction |
| `buildVFDescriptors` | Pure function — maps fontkit variation axes to CSS descriptors (`font-weight`, `font-stretch`, `font-style`), handling degenerate axes, `slnt`/`ital` priority, and `min > max` clamping |
| `generateFontData` | Fetches a TTF URL, parses with fontkit, and patches the Sanity font document with `metaData`, `metrics`, `glyphCount`, `opentypeFeatures`, `characterSet`, and variable axes/instances |
| `buildFontMetadata` | Pure function — extracts `metaData` and `metrics` from a fontkit instance without any Sanity side effects |
| `generateFontFile` | Fires a POST to the consuming site's `/api/sanity/fontWorker` endpoint with the format codes to convert (otf, woff, woff2, eot, svg, data) |
| `generateSubset` | Requests DS-WEB fingerprinted WOFF2 and display subset generation from an existing WOFF2 via fontWorker |
| `parseVariableFontInstances` | Resolves named variable font instances into Sanity font document references, creating documents for missing instances |
| `getEmptyFontKit` | Returns a zeroed-out fontkit-shaped placeholder used when no font binary is available |

### Keyword utilities

| Export | Description |
|---|---|
| `generateStyleKeywords` | Builds weight and italic keyword lists (including abbreviation expansions like `Bd → Bold`, `Lt → Light`) for parsing font subfamily names |
| `reverseSpellingLookup` | Resolves a font name abbreviation to its canonical weight name |
| `expandAbbreviations` | Expands all known abbreviations in a string to full weight names |
| `removeWeightNames` | Strips weight and italic keywords from a string, leaving only non-style words |

### Constants

| Export | Description |
|---|---|
| `SCRIPTS` | Array of supported script variant names |
| `SCRIPTS_OBJECT` | Map of script names to their display labels |
| `HtmlDescription` | React component rendering the supported script list as formatted HTML |

---

## Schema fields

### Font document (`font`)

| Field | Type | Description |
|---|---|---|
| `title` | `string` | Full font name (e.g. `MyFont SemiBold Italic`) |
| `slug` | `slug` | Sanitized document ID as a slug (`current` = document `_id`) |
| `typefaceName` | `string` | Name of the parent typeface |
| `style` | `string` | `'Regular'` or `'Italic'` |
| `weight` | `number` | Numeric CSS weight (100–900) |
| `weightName` | `string` | Human-readable weight name (e.g. `'SemiBold'`) |
| `subfamily` | `string` | Subfamily name (e.g. `'Condensed'`) |
| `variableFont` | `boolean` | `true` for variable fonts |
| `normalWeight` | `boolean` | `true` when the weight is the normal/regular weight |
| `fileInput` | `object` | Container for all uploaded format files |
| `fileInput.ttf` | `file` | Uploaded TTF file (Sanity asset reference) |
| `fileInput.otf` | `file` | OTF file (built from TTF or uploaded directly) |
| `fileInput.woff2` | `file` | WOFF2 file (built from TTF or uploaded directly) |
| `fileInput.woff` | `file` | WOFF file |
| `fileInput.eot` | `file` | EOT file (legacy) |
| `fileInput.svg` | `file` | SVG font file (legacy) |
| `fileInput.css` | `file` | Generated `@font-face` CSS file |
| `fileInput.woff2_web` | `file` | DS-WEB fingerprinted WOFF2 for web delivery |
| `fileInput.woff2_subset` | `file` | Display subset WOFF2 (Latin + Latin-1, fingerprinted) |
| `metaData` | `object` | Font metadata — `postscriptName`, `fullName`, `familyName`, `subfamilyName`, `copyright`, `version`, `genDate` |
| `metrics` | `object` | Font metrics — `unitsPerEm`, `ascender`, `descender`, `lineGap`, `capHeight`, `xHeight`, `italicAngle`, etc. |
| `glyphCount` | `number` | Total number of glyphs |
| `opentypeFeatures` | `object` | Available OpenType feature tags |
| `characterSet` | `object` | Array of Unicode code points covered by the font |
| `variableInstanceReferences` | `array<object>` | Maps variable font instance names to static font document references — `[{ key: string, value: reference }]` |

### Typeface document (`typeface`)

| Field | Type | Description |
|---|---|---|
| `styles.fonts` | `array<reference>` | References to regular font documents |
| `styles.variableFont` | `array<reference>` | References to variable font documents |
| `styles.collections` | `array<reference>` | References to generated collection documents |
| `styles.pairs` | `array<reference>` | References to generated pair documents |
| `styles.subfamilies` | `array<object>` | Subfamily groups — each has `title`, `_key`, and `fonts: array<reference>` |
| `preferredStyle` | `reference` | Reference to the preferred regular-weight font document |

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `SANITY_STUDIO_SITE_URL` | Yes | Base URL of the consuming site. Used by `generateFontFile` and `generateSubset` to call `/api/sanity/fontWorker`. |
| `SANITY_STUDIO_PROJECT_ID` | Yes | Sanity project ID. Used to build CDN file URLs inside the uploaders. |
| `SANITY_STUDIO_DATASET` | Yes | Sanity dataset name. Used alongside `PROJECT_ID` for CDN URLs. |
| `SANITY_STUDIO_SCRIPTS` | No | Comma-separated script variant names (e.g. `latin,greek,arabic`). Controls which script tabs appear. |
| `SANITY_STUDIO_DEFAULT_COLLECTION_PRICE` | No | Default per-font price for generated collections. |
| `SANITY_STUDIO_DEFAULT_PAIR_PRICE` | No | Default price for generated pairs. |

---

## Local development

To use the local source instead of the published npm package, symlink it into a foundry repo:

```bash
# From the sanity-font-manager directory:
npm run link:darden   # symlink into Darden Studio
npm run link:tdf      # symlink into The Designers Foundry
npm run link:mckl     # symlink into MCKL CMS
npm run link:all      # symlink into all three at once
```

Then run the watch build so consumers pick up changes live:

```bash
npm run dev
```

To restore the published package in a consumer repo, run `npm install` inside that repo.

---

## License

MIT — [Liiift Studio](https://github.com/Liiift-Studio)
