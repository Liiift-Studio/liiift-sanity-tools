/** tsup build config — no JSX, pure field definitions */
import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['cjs', 'esm'],
	dts: true,
	external: ['sanity'],
	clean: true,
	sourcemap: true,
})
