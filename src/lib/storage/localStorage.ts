import type { FinancialState } from '$lib/engine';
import type { UserProfile } from '$lib/schemas';
import type { DecisionRecord, GameStorage, PersistedGame } from './types';

/**
 * Browser storage backend. Used when the app runs in a plain browser (the live
 * web demo) where tauri-plugin-sql isn't available. Persists the whole game as
 * one JSON blob under a single key, so it survives reloads.
 */
const KEY = 'firstsalary-quest:game';

function read(): PersistedGame | null {
	if (typeof localStorage === 'undefined') return null;
	const raw = localStorage.getItem(KEY);
	if (!raw) return null;
	try {
		return JSON.parse(raw) as PersistedGame;
	} catch {
		return null;
	}
}

function write(game: PersistedGame): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(KEY, JSON.stringify(game));
}

function current(): PersistedGame {
	const game = read() ?? { profile: null, state: null, decisionHistory: [], quizResults: {} };
	// Back-compat for blobs saved before quizResults existed.
	game.quizResults ??= {};
	return game;
}

export function createLocalStorage(): GameStorage {
	return {
		async load(): Promise<PersistedGame | null> {
			const game = read();
			if (game) game.quizResults ??= {};
			return game;
		},
		async saveProfile(profile: UserProfile): Promise<void> {
			const game = current();
			game.profile = profile;
			write(game);
		},
		async saveState(state: FinancialState): Promise<void> {
			const game = current();
			game.state = state;
			write(game);
		},
		async addDecision(record: DecisionRecord): Promise<void> {
			const game = current();
			game.decisionHistory = [...game.decisionHistory, record];
			write(game);
		},
		async recordQuiz(questionId: string, correct: boolean): Promise<void> {
			const game = current();
			game.quizResults = { ...game.quizResults, [questionId]: correct };
			write(game);
		},
		async reset(): Promise<void> {
			if (typeof localStorage !== 'undefined') localStorage.removeItem(KEY);
		}
	};
}
