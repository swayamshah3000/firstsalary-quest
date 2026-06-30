import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// Tauri expects a fixed dev port and ignores Vite's HMR websocket settings unless
// they're pinned. The TAURI_DEV_HOST env var is set by the Tauri CLI on mobile.
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// adapter-static turns the app into a single-page app that Tauri can serve
			// from disk. SSR is disabled in src/routes/+layout.ts.
			adapter: adapter({
				// Prerendered routes keep their own index.html; 200.html is the SPA
				// fallback Tauri serves for any non-prerendered path.
				fallback: '200.html'
			})
		})
	],

	// Tauri-specific Vite tuning (see https://v2.tauri.app/start/frontend/sveltekit/)
	clearScreen: false,
	server: {
		port: 1420,
		strictPort: true,
		host: host || false,
		hmr: host
			? {
					protocol: 'ws',
					host,
					port: 1421
				}
			: undefined,
		watch: {
			// Don't watch the Rust backend; cargo handles that.
			ignored: ['**/src-tauri/**']
		}
	}
});
