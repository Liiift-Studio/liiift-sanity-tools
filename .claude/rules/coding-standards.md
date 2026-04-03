# Coding Standards — Liiift Sanity Tools

These rules apply to all packages in this monorepo.

## Indentation
- Use **tabs**, not spaces

## File Headers
- Every file you create or significantly modify must have a 1-line summary comment at the top
- If an existing summary is outdated or wrong, update it

## Logging
- Begin all status and console-logged static strings with a **capital letter**
- Use `console.error` or `console.warn` for errors and warnings — never `console.log` for those cases

## Naming
- **Do not correct the spelling** of existing variables, functions, or methods — even if misspelled
- Name new files and artifacts consistently with their physical file names (kebab-case for files, camelCase for JS identifiers)
- Use `ALL_CAPS` for manifest-style constants

## Comments
- Comment every function with a concise description of what it does
- Comment every interface and type
- Comment every global variable — include allowed range, units, and meaning

## Monorepo & Plugin Discipline
- **Always `cd` into the specific plugin directory** before running commands — there is no root-level install
- These are **Sanity plugins** — do not add Next.js or app-router patterns to any plugin
- **Changes to shared plugins affect all consumer studios** — check downstream usage before modifying exports
- Test plugin changes in `/test-studio` before committing

## Secrets & Environment Variables
- Never hard-code secrets, API keys, or tokens
- Always use `process.env.VARIABLE_NAME`
- Never log secret values

## Dependencies
- Package manager is **npm** — run `npm install` inside the relevant plugin directory
- Do not install new packages without explicit instruction
- Do not convert `.js` files to TypeScript without explicit instruction

## Staging & Git
- Check `.gitignore` before staging — never stage `node_modules` or build artifacts

## Code Reuse
- Check `sanity-studio-utilities` for shared helpers before writing new utility functions in a plugin
