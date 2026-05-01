import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['esm', 'cjs'],
	dts: false,
	clean: true,
	jsx: true,
	external: ['react', 'react-dom', 'sanity', '@sanity/ui'],
})
