import { writable, derived, get } from 'svelte/store';
import type { UserProfile } from '$lib/schemas';
import type { DecisionCard } from '$lib/schemas/decisionCard';
import {
	createInitialState,
	computeMeters,
	resilienceScore,
	resilienceBand,
	netWorthValue,
	applyEffects,
	advanceMonth as engineAdvanceMonth,
	type FinancialState,
	type Meters
} from '$lib/engine';
import { getStorage, type DecisionRecord, type GameStorage } from '$lib/storage';
import { evaluateBadges, type EvaluatedBadge } from '$lib/badges';

// Re-export so existing imports of DecisionRecord from the store keep working.
export type { DecisionRecord } from '$lib/storage';

/** The five meter keys, in display order. */
export const scoreKeys = [
	'netWorth',
	'emergencyFund',
	'protectionScore',
	'lifestyleInflation',
	'financialFreedom'
] as const;

export type ScoreKey = (typeof scoreKeys)[number];

/** Plain-language explanation of each meter, shown via the ⓘ on ScoreMeter. */
export const meterInfo: Record<ScoreKey, string> = {
	netWorth:
		'Everything you own (cash + savings + investments) minus what you owe (loans). Your true financial position — higher is better.',
	emergencyFund:
		'Progress toward a safe cushion: the meter reaches 100 when your savings + cash could cover 3 months of essential expenses. A lower number means fewer months covered (e.g. ~69 ≈ 2 months).',
	protectionScore:
		'How well insurance shields you from big shocks like a hospital bill or accident. Higher means better protected.',
	lifestyleInflation:
		'How much of your income goes to non-essential "wants". A higher score means you are keeping lifestyle spending in check.',
	financialFreedom:
		'Progress toward money working for you — how much you have invested relative to your income. Higher means closer to financial freedom.'
};

export const TOTAL_MONTHS = 12;

const NEUTRAL_METERS: Meters = {
	netWorth: 50,
	emergencyFund: 50,
	protectionScore: 50,
	lifestyleInflation: 50,
	financialFreedom: 50
};

// --- Core stores ------------------------------------------------------------

/** null until the player completes /setup. */
export const userProfile = writable<UserProfile | null>(null);

/** The engine's financial state (cash, loans, SIPs, history…). null pre-setup. */
export const gameState = writable<FinancialState | null>(null);

/** Ordered history of decisions made this run. */
export const decisionHistory = writable<DecisionRecord[]>([]);

/** Latest quiz answer per questionId (true = answered correctly). */
export const quizResults = writable<Record<string, boolean>>({});

// --- Derived views ----------------------------------------------------------

/** Has the player finished setting up a character? */
export const hasProfile = derived(userProfile, ($p) => $p !== null);

/** The five 0-100 meters, derived from the real financial state. */
export const meters = derived(gameState, ($s) => ($s ? computeMeters($s) : NEUTRAL_METERS));

/** Month currently being played (1..12); 13 once the year is done. */
export const currentMonth = derived(gameState, ($s) => ($s ? $s.month : 0) + 1);

/** Is the 12-month run complete? */
export const isGameOver = derived(gameState, ($s) => !!$s && $s.month >= TOTAL_MONTHS);

/** Single 0-100 Financial Resilience Score. */
export const resilience = derived(meters, ($m) => resilienceScore($m));

/** Non-advisory verdict band for the resilience score. */
export const resilienceVerdict = derived(resilience, ($r) => resilienceBand($r));

/** All badges with their earned/locked status, derived from the game state. */
export const badges = derived([gameState, meters, isGameOver], ([$s, $m, $over]): EvaluatedBadge[] => {
	if (!$s) return [];
	return evaluateBadges({ state: $s, meters: $m, gameOver: $over });
});

/** How many badges the player has earned so far. */
export const earnedBadgeCount = derived(badges, ($b) => $b.filter((badge) => badge.earned).length);

/** Money summary in rupees for the dashboard / game header. */
export const moneySummary = derived(gameState, ($s) => ({
	cash: $s?.cash ?? 0,
	emergencyFund: $s?.emergencyFund ?? 0,
	investments: $s?.investments ?? 0,
	netWorth: $s ? netWorthValue($s) : 0
}));

// --- Persistence ------------------------------------------------------------

/**
 * Fire-and-forget write-through to the active storage backend (SQLite on
 * desktop, localStorage in the browser). Failures are logged, not thrown.
 */
function persist(fn: (storage: GameStorage) => Promise<void>): void {
	void getStorage()
		.then((storage) => fn(storage))
		.catch((err) => console.warn('[gameStore] persist failed:', err));
}

/** Load any saved game into the stores. Call once on app start (client-side). */
export async function hydrate(): Promise<void> {
	try {
		const storage = await getStorage();
		const saved = await storage.load();
		if (!saved) return;
		// Quiz progress is independent of a character — restore it either way.
		quizResults.set(saved.quizResults ?? {});
		if (!saved.profile) return;
		userProfile.set(saved.profile);
		// Fall back to a fresh state if a profile was saved without one.
		gameState.set(saved.state ?? createInitialState(saved.profile));
		decisionHistory.set(saved.decisionHistory);
	} catch (err) {
		console.warn('[gameStore] hydrate failed:', err);
	}
}

// --- Actions ----------------------------------------------------------------

/**
 * Apply a chosen option: run its financial effects through the engine, then
 * simulate the month. Records the decision and persists everything.
 */
export function applyChoice(card: DecisionCard, choiceIndex: number): void {
	const state = get(gameState);
	const choice = card.choices[choiceIndex];
	if (!state || !choice) return;

	const next = engineAdvanceMonth(applyEffects(state, choice.effects));
	gameState.set(next);

	const record: DecisionRecord = {
		cardId: card.id,
		month: card.month,
		choiceIndex,
		label: choice.label
	};
	decisionHistory.update((history) => [...history, record]);

	persist(async (storage) => {
		await storage.addDecision(record);
		await storage.saveState(next);
	});
}

/** Advance a month with no decision (a "quiet month"). */
export function skipMonth(): void {
	const state = get(gameState);
	if (!state) return;
	const next = engineAdvanceMonth(state);
	gameState.set(next);
	persist((storage) => storage.saveState(next));
}

/** Record a quiz answer and persist it (latest answer per question wins). */
export function recordQuizAnswer(questionId: string, correct: boolean): void {
	quizResults.update((current) => ({ ...current, [questionId]: correct }));
	persist((storage) => storage.recordQuiz(questionId, correct));
}

/** Reset everything back to a brand-new game, including storage. */
export function resetGame(): void {
	userProfile.set(null);
	gameState.set(null);
	decisionHistory.set([]);
	quizResults.set({});
	persist((storage) => storage.reset());
}

/**
 * Start a fresh game with a new character. Awaits storage so the wipe-then-save
 * ordering is deterministic before the caller navigates into the game.
 */
export async function startNewGame(profile: UserProfile): Promise<void> {
	const storage = await getStorage();
	await storage.reset();
	const state = createInitialState(profile);
	userProfile.set(profile);
	gameState.set(state);
	decisionHistory.set([]);
	quizResults.set({});
	await storage.saveProfile(profile);
	await storage.saveState(state);
}

/** Snapshot the whole game state (e.g. for debugging). */
export function snapshot() {
	return {
		userProfile: get(userProfile),
		gameState: get(gameState),
		decisionHistory: get(decisionHistory)
	};
}
