# Progress — sanity-font-manager

## What works (v2.3.2)

All components exported and functional:

| Component | Status |
|---|---|
| `BatchUploadFonts` | Working |
| `SingleUploaderTool` | Working — responsive split button (columns=[1,2]) |
| `GenerateCollectionsPairsComponent` | Working |
| `PrimaryCollectionGeneratorTypeface` | Working — added v2.3.2 |
| `FontScriptUploaderComponent` | Working |
| `UploadScriptsComponent` | Working |
| `UpdateScriptsComponent` | Working — isReadyRef loop guard |
| `RegenerateSubfamiliesComponent` | Working |
| `KeyValueInput` | Working |
| `KeyValueReferenceInput` | Working — generic fetchReferences prop |
| `VariableInstanceReferencesInput` | Working — autofill with matching + keys-only |

All font processing utilities, CSS generation, and keyword utilities exported and tested (111 tests passing).

## Consumer migration status

| Component | Darden | TDF | MCKL |
|---|---|---|---|
| `BatchUploadFonts` | ✅ | ✅ | ✅ |
| `GenerateCollectionsPairsComponent` | ✅ | ✅ | ✅ |
| `UpdateScriptsComponent` | ✅ | ✅ | ✅ |
| `PrimaryCollectionGeneratorTypeface` | ✅ | ✅ | n/a |
| `KeyValueReferenceInput` | n/a | ✅ | n/a |
| `VariableInstanceReferencesInput` | n/a | ✅ | n/a |
| `KeyValueInput` | local | local | local |
| `AdvancedRefArray` | local | local | local |

## Not yet in library

- `KeyValueInput` — identical local copies in all three sites; deferred (not confirmed font-specific)
- `AdvancedRefArray` — local in all three sites; purpose not yet reviewed
- `PrimaryCollectionGenerator` (collection-level) — Darden only; combines fonts from existing collections into one; different from `PrimaryCollectionGeneratorTypeface`

## No known bugs
