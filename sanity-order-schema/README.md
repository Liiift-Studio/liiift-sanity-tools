# @liiift-studio/sanity-order-schema

**Internal — not published to npm.**

Shared Sanity `order` document schema for Liiift Studio typeface foundries (Darden, TDF, Sorkin, MCKL). Exposes a `createOrderSchema(options)` factory that reads feature flags from environment variables so each studio only shows the fields it needs.

---

## Usage

```ts
// sanity/schemas/order.ts
import { createOrderSchema } from '@liiift-studio/sanity-order-schema'

export default createOrderSchema()
```

## Feature Flags

Each flag reads its corresponding `SANITY_STUDIO_*` env var by default, but can be overridden explicitly:

| Option | Env var | What it adds |
|---|---|---|
| `enableRenewals` | `SANITY_STUDIO_RENEWALS_ENABLED` | Order type selector, renewal info, upgrade info |
| `enableMerch` | `SANITY_STUDIO_MERCH_ENABLED` | Merch array, shipping cluster, shipping address |
| `enableScripts` | `SANITY_STUDIO_SCRIPTS_ENABLED` | Scripts support array |
| `enableGuestCheckout` | `SANITY_STUDIO_GUEST_CHECKOUT` | Suppresses the account reference field |

**Example — Darden (renewals + merch, no scripts, no account ref):**
```ts
createOrderSchema() // reads env vars directly
```

**Example — Sorkin (scripts, account ref, no merch):**
```ts
createOrderSchema({
  enableScripts: true,
  enableGuestCheckout: false, // shows account reference
})
```

## Consuming this package

Since it's private (not on npm), reference it from the parent sanity-tools git repo:

```json
"@liiift-studio/sanity-order-schema": "github:Liiift-Studio/sanity-tools#main&path=sanity-order-schema"
```

Or via a local file path during development:
```json
"@liiift-studio/sanity-order-schema": "file:../../tools/sanity-tools/sanity-order-schema"
```

## Building

```bash
npm install
npm run build   # outputs to dist/
npm run dev     # watch mode
```
