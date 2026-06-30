import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Standalone Vitest config (no SvelteKit plugin) so the pure-logic modules —
// the financial engine and calculators — can be unit tested in plain Node.
// We only need the `$lib` alias resolved.
export default defineConfig({
	resolve: {
		alias: {
			$lib: fileURLToPath(new URL('./src/lib', import.meta.url))
		}
	},
	test: {
		include: ['src/**/*.{test,spec}.ts'],
		environment: 'node'
	}
});
