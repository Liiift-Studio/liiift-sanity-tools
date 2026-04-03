# Liiift Sanity Tools — Claude Code Configuration

## Memory Bank (Read Before Every Task)

Before starting any task, read ALL files in `.agent/memory/` in this order:

1. `.agent/memory/projectbrief.md` — project scope, goals, identity
2. `.agent/memory/productContext.md` — why it exists, user goals
3. `.agent/memory/systemPatterns.md` — architecture, patterns, component relationships
4. `.agent/memory/techContext.md` — full tech stack and dependencies
5. `.agent/memory/activeContext.md` — current work focus, recent changes, next steps
6. `.agent/memory/progress.md` — what works, what's left, known issues

After any significant changes, update `.agent/memory/activeContext.md` and `.agent/memory/progress.md`.

---

## Overview

This is a **monorepo of 14 Sanity plugins/tools**. Each tool lives in its own subdirectory with its own `package.json`.

### Tools in this repo

| Tool | Purpose |
|---|---|
| `sanity-advanced-reference-array` | Advanced array field with reference support |
| `sanity-bulk-data-operations` | Bulk create/update/delete operations |
| `sanity-convert-ids-to-slugs` | Migrate document IDs to slug-based IDs |
| `sanity-convert-references` | Convert reference field types |
| `sanity-delete-unused-assets` | Clean up unreferenced Sanity assets |
| `sanity-duplicate-and-rename` | Duplicate documents with rename |
| `sanity-enhanced-commerce` | Enhanced e-commerce schema helpers |
| `sanity-export-data` | Export Sanity data to various formats |
| `sanity-font-data-extractor` | Extract font metadata from uploaded files |
| `sanity-font-management-suite` | Full font management UI for Sanity |
| `sanity-renewals-authorization` | Subscription/renewal authorization logic |
| `sanity-sales-portal` | Sales portal Sanity integration |
| `sanity-search-and-delete` | Search documents and bulk delete |
| `sanity-studio-utilities` | Shared utility functions for Sanity Studio |

---

## Tech Stack

- **Type:** Sanity v3 plugin monorepo
- **Package Manager:** npm (each tool has its own `package.json` — run `npm` inside the relevant tool directory)
- **Test Studio:** `/test-studio` — a Sanity Studio used to test plugins locally

---

## Common Pitfalls

- **This is a monorepo** — always `cd` into the specific tool directory before running commands
- **These are Sanity plugins** — not Next.js apps; do not add Next.js patterns
- **Never hard-code secrets** — always use `process.env.VARIABLE_NAME`
- **Do not correct spelling** of existing variables, functions, or method names (even if misspelled)
- **Changes to shared utilities affect all consuming tools** — check usage before modifying `sanity-studio-utilities`

---

## Dev Workflow

```bash
# Test a plugin locally
cd test-studio && npm run dev

# Work on a specific plugin
cd sanity-<plugin-name>
npm install
npm run build   # if applicable
```

---

## Architecture Notes

- Plugins are consumed by other repos (mckl/cms, tdf, positype, sorkin, etc.) — breaking changes need coordination
- `/test-studio` is the integration testing environment for all plugins
- See `SANITY_TOOLS_OVERVIEW.md` and `README.md` at the repo root for high-level documentation
