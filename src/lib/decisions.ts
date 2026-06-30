import { decisionCardSchema, type DecisionCard } from '$lib/schemas/decisionCard';

/**
 * Eagerly import every authored decision card from src/content/decisions and
 * validate it against the Zod schema at module load. Malformed content throws
 * immediately, so authoring mistakes surface during development rather than mid-game.
 */
const modules = import.meta.glob('../content/decisions/*.json', { eager: true });

export const decisionCards: DecisionCard[] = Object.entries(modules)
	.map(([path, mod]) => {
		const raw = (mod as { default: unknown }).default;
		const result = decisionCardSchema.safeParse(raw);
		if (!result.success) {
			throw new Error(`Invalid decision card ${path}: ${result.error.message}`);
		}
		return result.data;
	})
	.sort((a, b) => a.month - b.month || a.id.localeCompare(b.id));

/** All cards authored for a given month (a month can have several). */
export function cardsForMonth(month: number): DecisionCard[] {
	return decisionCards.filter((card) => card.month === month);
}

/** First card for a month — kept for simple lookups. */
export function cardForMonth(month: number): DecisionCard | undefined {
	return cardsForMonth(month)[0];
}

/** Small stable string hash, so a pick is deterministic across reloads. */
function hashString(s: string): number {
	let h = 0;
	for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
	return Math.abs(h);
}

/**
 * Pick one card for a month deterministically from a seed (e.g. the player's
 * character). Different characters see different scenarios — adding replay
 * variety — while a single run stays stable when the page reloads.
 */
export function pickCardForMonth(month: number, seed: string): DecisionCard | undefined {
	const pool = cardsForMonth(month);
	if (pool.length === 0) return undefined;
	return pool[hashString(`${seed}:${month}`) % pool.length];
}
