import type { FinancialState } from '$lib/engine';
import type { UserProfile } from '$lib/schemas';

/** One committed decision in a play-through (mirrors a decision_history row). */
export interface DecisionRecord {
	cardId: string;
	month: number;
	choiceIndex: number;
	label: string;
}

/** A full saved game — enough to restore the UI exactly on reopen. */
export interface PersistedGame {
	profile: UserProfile | null;
	/** The engine's financial state (cash, loans, SIPs, history, …). */
	state: FinancialState | null;
	decisionHistory: DecisionRecord[];
	/** Latest quiz answer per questionId (true = answered correctly). */
	quizResults: Record<string, boolean>;
}

/**
 * Storage backend the game persists through. Two implementations exist:
 *   - sqlite.ts        → real SQLite via tauri-plugin-sql (desktop app)
 *   - localStorage.ts  → browser localStorage (web preview / live demo)
 * They are interchangeable; index.ts picks one at runtime.
 */
export interface GameStorage {
	/** Load the saved game, or null if there isn't one yet. */
	load(): Promise<PersistedGame | null>;
	/** Persist (or replace) the player's character. */
	saveProfile(profile: UserProfile): Promise<void>;
	/** Persist the full engine state (current month lives inside it). */
	saveState(state: FinancialState): Promise<void>;
	/** Append a committed decision. */
	addDecision(record: DecisionRecord): Promise<void>;
	/** Record a quiz answer (latest answer per question wins on reload). */
	recordQuiz(questionId: string, correct: boolean): Promise<void>;
	/** Wipe everything (start a brand-new game). */
	reset(): Promise<void>;
}
