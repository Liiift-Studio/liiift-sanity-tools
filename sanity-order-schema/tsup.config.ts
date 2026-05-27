// tsup build config — outputs CJS + ESM with type declarations
import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['cjs', 'esm'],
	dts: true,
	sourcemap: true,
	clean: true,
	external: ['react', 'sanity', '@sanity/ui'],
	jsx: 'react-jsx',
})
