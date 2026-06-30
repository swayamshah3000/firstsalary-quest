import { createLocalStorage } from './localStorage';
import type { GameStorage } from './types';

export type { GameStorage, PersistedGame, DecisionRecord } from './types';

/** True when running inside the Tauri desktop runtime (vs a plain browser). */
export function isTauri(): boolean {
	return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

let instance: Promise<GameStorage> | null = null;

/**
 * Get the storage backend for the current environment (memoized):
 *   - desktop app → SQLite (loaded dynamically so plugin-sql never touches the
 *                   browser/prerender build)
 *   - browser     → localStorage
 */
export function getStorage(): Promise<GameStorage> {
	if (!instance) {
		instance = isTauri()
			? import('./sqlite').then((m) => m.createSqliteStorage())
			: Promise.resolve(createLocalStorage());
	}
	return instance;
}
