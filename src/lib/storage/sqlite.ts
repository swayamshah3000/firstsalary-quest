import { getDb } from '$lib/db';
import { decisionCards } from '$lib/decisions';
import type { FinancialState } from '$lib/engine';
import type { FamilyDependency, JobType, UserProfile } from '$lib/schemas';
import type { DecisionRecord, GameStorage, PersistedGame } from './types';

/**
 * SQLite storage backend (desktop app). The app is single-user locally, so "the
 * current game" is the most recent user_profile row. The full engine state is
 * stored as JSON in game_progress.scores; decisions are kept normalized.
 *
 * This module is only ever loaded inside the Tauri runtime (index.ts imports it
 * dynamically), so importing tauri-plugin-sql here never runs during prerender.
 */
interface ProfileRow {
	id: number;
	name: string;
	city: string;
	salary: number;
	family_dependency: string;
	job_type: string;
}

export function createSqliteStorage(): GameStorage {
	let userId: number | null = null;

	return {
		async load(): Promise<PersistedGame | null> {
			const db = await getDb();
			const profiles = await db.select<ProfileRow[]>(
				`SELECT * FROM user_profile ORDER BY id DESC LIMIT 1`
			);
			const row = profiles[0];
			if (!row) return null;
			userId = row.id;

			const profile: UserProfile = {
				name: row.name,
				city: row.city,
				salary: row.salary,
				familyDependency: row.family_dependency as FamilyDependency,
				jobType: row.job_type as JobType
			};

			const progress = await db.select<{ scores: string }[]>(
				`SELECT scores FROM game_progress WHERE user_id = $1 ORDER BY id DESC LIMIT 1`,
				[userId]
			);
			let state: FinancialState | null = null;
			if (progress[0]) {
				try {
					state = JSON.parse(progress[0].scores) as FinancialState;
				} catch {
					state = null;
				}
			}

			const decisions = await db.select<
				{ card_id: string; choice_made: number; month: number }[]
			>(
				`SELECT card_id, choice_made, month FROM decision_history
				 WHERE user_id = $1 ORDER BY id ASC`,
				[userId]
			);
			const byId = new Map(decisionCards.map((card) => [card.id, card]));
			const decisionHistory: DecisionRecord[] = decisions.map((d) => ({
				cardId: d.card_id,
				month: d.month,
				choiceIndex: d.choice_made,
				label: byId.get(d.card_id)?.choices[d.choice_made]?.label ?? ''
			}));

			// Latest answer per question wins (rows are in insert order).
			const quizRows = await db.select<{ question_id: string; correct: number }[]>(
				`SELECT question_id, correct FROM quiz_results WHERE user_id = $1 ORDER BY id ASC`,
				[userId]
			);
			const quizResults: Record<string, boolean> = {};
			for (const row of quizRows) quizResults[row.question_id] = row.correct === 1;

			return { profile, state, decisionHistory, quizResults };
		},

		async saveProfile(profile: UserProfile): Promise<void> {
			const db = await getDb();
			const result = await db.execute(
				`INSERT INTO user_profile (name, city, salary, family_dependency, job_type)
				 VALUES ($1, $2, $3, $4, $5)`,
				[profile.name, profile.city, profile.salary, profile.familyDependency, profile.jobType]
			);
			userId = result.lastInsertId ?? null;
		},

		async saveState(state: FinancialState): Promise<void> {
			if (userId == null) return;
			const db = await getDb();
			await db.execute(
				`INSERT INTO game_progress (user_id, current_month, scores) VALUES ($1, $2, $3)`,
				[userId, state.month, JSON.stringify(state)]
			);
		},

		async addDecision(record: DecisionRecord): Promise<void> {
			if (userId == null) return;
			const db = await getDb();
			await db.execute(
				`INSERT INTO decision_history (user_id, card_id, choice_made, month)
				 VALUES ($1, $2, $3, $4)`,
				[userId, record.cardId, record.choiceIndex, record.month]
			);
		},

		async recordQuiz(questionId: string, correct: boolean): Promise<void> {
			if (userId == null) return;
			const db = await getDb();
			await db.execute(
				`INSERT INTO quiz_results (user_id, question_id, correct) VALUES ($1, $2, $3)`,
				[userId, questionId, correct ? 1 : 0]
			);
		},

		async reset(): Promise<void> {
			const db = await getDb();
			// Delete children first — SQLite foreign-key cascade is off by default
			// on a fresh connection, so we don't rely on it.
			await db.execute(`DELETE FROM quiz_results`);
			await db.execute(`DELETE FROM badges`);
			await db.execute(`DELETE FROM decision_history`);
			await db.execute(`DELETE FROM game_progress`);
			await db.execute(`DELETE FROM user_profile`);
			userId = null;
		}
	};
}
