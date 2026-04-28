/** tsup build config — field definitions + React evaluator component */
import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['cjs', 'esm'],
	dts: true,
	external: ['sanity', 'react', 'react/jsx-runtime', '@sanity/ui'],
	clean: true,
	sourcemap: true,
})
