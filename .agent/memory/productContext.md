# Product Context — Liiift Sanity Tools

## Why it exists

Type foundries using Sanity as their CMS need complex font management UI that Sanity doesn't provide — batch uploading font files, converting between formats, generating CSS `@font-face` declarations, building collections and pairs for the shop, and managing variable font instances.

Before this library, each foundry site (Darden, TDF, MCKL) had local copies of these components. They diverged — some had GROQ injection bugs (string interpolation instead of `$param`), some had infinite-loop risks in `useEffect`, some had broken import paths. The library centralises these into one tested, maintained package.

## Users

Studio editors and type designers at each foundry. Components must be clear, non-destructive where possible, and informative (status messages, spinners during long operations).

## Success criteria

- An editor can batch-upload a full typeface's font files and have all formats, CSS, and metadata generated without developer involvement
- Generating collections and pairs is one click
- Variable font instance mapping is guided (autofill buttons)
- A developer adding a new foundry Studio can install one package and wire up all font management in their schema
