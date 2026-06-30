import Database from '@tauri-apps/plugin-sql';
import type { Scores, UserProfile } from '$lib/schemas';

/**
 * Local database access.
 *
 * The schema itself lives in ./schema.sql and is created by the Rust migration
 * (see src-tauri/src/lib.rs). This module only opens the connection and exposes
 * typed helpers. Keep DB_URL in sync with DB_URL in src-tauri/src/lib.rs.
 */
export const DB_URL = 'sqlite:firstsalary.db';

let dbPromise: Promise<Database> | null = null;

/** Open (once) and return the SQLite connection. */
export function getDb(): Promise<Database> {
	if (!dbPromise) {
		dbPromise = Database.load(DB_URL);
	}
	return dbPromise;
}

// --- user_profile -----------------------------------------------------------

export async function createProfile(profile: UserProfile): Promise<number> {
	const db = await getDb();
	const result = await db.execute(
		`INSERT INTO user_profile (name, city, salary, family_dependency, job_type)
		 VALUES ($1, $2, $3, $4, $5)`,
		[profile.name, profile.city, profile.salary, profile.familyDependency, profile.jobType]
	);
	return result.lastInsertId ?? 0;
}

export interface ProfileRow {
	id: number;
	name: string;
	city: string;
	salary: number;
	family_dependency: string;
	job_type: string;
	created_at: string;
}

export async function getProfile(userId: number): Promise<ProfileRow | undefined> {
	const db = await getDb();
	const rows = await db.select<ProfileRow[]>(`SELECT * FROM user_profile WHERE id = $1`, [
		userId
	]);
	return rows[0];
}

// --- game_progress ----------------------------------------------------------

export async function saveProgress(
	userId: number,
	currentMonth: number,
	scores: Scores
): Promise<void> {
	const db = await getDb();
	await db.execute(
		`INSERT INTO game_progress (user_id, current_month, scores) VALUES ($1, $2, $3)`,
		[userId, currentMonth, JSON.stringify(scores)]
	);
}

// --- decision_history -------------------------------------------------------

export async function recordDecision(
	userId: number,
	cardId: string,
	choiceMade: number,
	month: number
): Promise<void> {
	const db = await getDb();
	await db.execute(
		`INSERT INTO decision_history (user_id, card_id, choice_made, month)
		 VALUES ($1, $2, $3, $4)`,
		[userId, cardId, choiceMade, month]
	);
}

// --- badges -----------------------------------------------------------------

export async function awardBadge(userId: number, badgeId: string): Promise<void> {
	const db = await getDb();
	// UNIQUE(user_id, badge_id) makes re-awarding a no-op.
	await db.execute(
		`INSERT OR IGNORE INTO badges (user_id, badge_id) VALUES ($1, $2)`,
		[userId, badgeId]
	);
}

// --- quiz_results -----------------------------------------------------------

export async function recordQuizAnswer(
	userId: number,
	questionId: string,
	correct: boolean
): Promise<void> {
	const db = await getDb();
	await db.execute(
		`INSERT INTO quiz_results (user_id, question_id, correct) VALUES ($1, $2, $3)`,
		[userId, questionId, correct ? 1 : 0]
	);
}
