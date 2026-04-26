# Active Context — sanity-font-manager

Last updated: 2026-04-26
Published version: **v2.3.2**
Branch: `feature/studio-version-badge`

## Current state

All three consumer sites (Darden, TDF, MCKL) are on `^2.3.2` on their `feature/font-uploader-v2` branches.

## Recently completed

- Added `KeyValueInput`, `KeyValueReferenceInput`, `VariableInstanceReferencesInput` (v2.3.0)
- Fixed split button responsiveness in `SingleUploaderTool` — `columns={[1, 2]}` (v2.3.1)
- Updated README with all new component docs (v2.3.1)
- Added `PrimaryCollectionGeneratorTypeface` — generates single full-family collection, prepends to existing (v2.3.2)
- Migrated `UpdateScriptsComponent` and `GenerateCollectionsPairsComponent` from TDF/MCKL local copies
- Migrated `PrimaryCollectionGeneratorTypeface` from Darden/TDF local copies (both deleted)
- Migrated `KeyValueReferenceInput` and `VariableInstanceReferencesInput` from TDF — fixed broken import path and removed hardcoded font filter logic

## Pending

- No immediate tasks
- `KeyValueInput` local copies remain in all three consumer sites — not yet reviewed for migration
- `PrimaryCollectionGenerator` (collection-level, Darden only) — distinct from `PrimaryCollectionGeneratorTypeface`, not yet reviewed for library inclusion
