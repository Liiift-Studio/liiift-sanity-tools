# System Patterns — sanity-font-manager

## Directory structure

```
sanity-font-uploader/
├── src/
│   ├── components/         # All Sanity input components (JSX)
│   ├── hooks/
│   │   └── useSanityClient.js   # useClient({ apiVersion: '2022-11-09' })
│   └── utils/              # Pure utilities and font processing functions
├── dist/                   # Built output (CJS + ESM via tsup)
└── src/index.js            # Single export entry point
```

## Component pattern

All components are mounted on schema fields via `components: { input: ComponentName }`. They follow this structure:

- Read form state via `useFormValue(['field', 'path'])` — never via props
- Write to Sanity via `useSanityClient()` direct client patches
- Exception: `KeyValueInput` and `KeyValueReferenceInput` use `onChange(set(...))` as they are true array editors
- UI primitives: `@sanity/ui` only — Stack, Flex, Card, Button, Text, Spinner, Grid
- Loading state: replace Card content with `<Spinner />` while async work runs
- Status feedback: `<StatusDisplay status={...} error={false} />` above the Card

## Standard layout

```jsx
<Stack space={2}>
  <StatusDisplay status={status} error={false} />
  <Card border padding={2} shadow={1} radius={2}>
    {ready ? (
      <Stack space={3}>
        {/* controls */}
      </Stack>
    ) : (
      <Flex align="center" justify="center" gap={3} padding={4}>
        <Spinner />
        <Text muted size={1}>{status}</Text>
      </Flex>
    )}
  </Card>
</Stack>
```

## Key patterns

- **GROQ always parameterised** — `client.fetch('*[_id == $id]', { id })` never string interpolation
- **isReadyRef guard** — `UpdateScriptsComponent` uses a ref + 100ms timeout to prevent `useEffect` firing `onChange` on mount (infinite loop risk)
- **Prepend vs replace** — `PrimaryCollectionGeneratorTypeface` prepends to existing collections; `GenerateCollectionsPairsComponent` replaces all collections/pairs
- **fontWorker is external** — `generateFontFile` and `generateSubset` POST to the consumer site's `/api/sanity/fontWorker` — no conversion logic in the library
- **Generic props pattern** — `KeyValueReferenceInput` accepts `fetchReferences(client, doc)` and `topActions` so callers control filtering and actions without forking the component
