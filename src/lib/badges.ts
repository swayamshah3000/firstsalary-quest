import type { FinancialState, Meters } from '$lib/engine';

/**
 * Badges are achievements derived from the player's financial state — they are a
 * pure function of the (persisted) game state + meters, so they never need to be
 * stored separately; they recompute correctly on reload. The `badges` SQLite
 * table remains available for future cloud sync.
 */
export interface BadgeContext {
	state: FinancialState;
	meters: Meters;
	gameOver: boolean;
}

export interface BadgeDef {
	id: string;
	name: string;
	emoji: string;
	description: string;
	earned: (ctx: BadgeContext) => boolean;
}

export type EvaluatedBadge = Omit<BadgeDef, 'earned'> & { earned: boolean };

export const ALL_BADGES: BadgeDef[] = [
	{
		id: 'emergency-starter',
		name: 'Emergency Fund Starter',
		emoji: '🛟',
		description: 'Set aside your first emergency savings.',
		earned: ({ state }) => state.emergencyFund > 0
	},
	{
		id: 'safety-net',
		name: 'Safety Net Pro',
		emoji: '🏦',
		description: 'Built a strong 3+ month emergency cushion.',
		earned: ({ meters }) => meters.emergencyFund >= 80
	},
	{
		id: 'sip-beginner',
		name: 'SIP Beginner',
		emoji: '📈',
		description: 'Started your first monthly SIP.',
		earned: ({ state }) => state.sips.length > 0
	},
	{
		id: 'insurance-aware',
		name: 'Insurance Aware',
		emoji: '🛡️',
		description: 'Bought your own health insurance.',
		earned: ({ state }) => state.insurance.health > 0
	},
	{
		id: 'fully-protected',
		name: 'Fully Protected',
		emoji: '🧯',
		description: 'Reached a strong overall protection score.',
		earned: ({ meters }) => meters.protectionScore >= 80
	},
	{
		id: 'lifestyle-slayer',
		name: 'Lifestyle Inflation Slayer',
		emoji: '🧊',
		description: 'Kept lifestyle inflation firmly in check.',
		earned: ({ meters }) => meters.lifestyleInflation >= 80
	},
	{
		id: 'emi-escape',
		name: 'EMI Escape Artist',
		emoji: '🚫',
		description: 'Finished the year with zero outstanding loans.',
		earned: ({ state, gameOver }) => gameOver && state.loans.length === 0
	},
	{
		id: 'wealth-builder',
		name: 'Wealth Builder',
		emoji: '👑',
		description: 'Grew your net worth to a strong position.',
		earned: ({ meters }) => meters.netWorth >= 80
	},
	{
		id: 'money-graduate',
		name: 'Money Graduate',
		emoji: '🎓',
		description: 'Completed all 12 months of your first salary year.',
		earned: ({ gameOver }) => gameOver
	}
];

/** Evaluate every badge against the current context. */
export function evaluateBadges(ctx: BadgeContext): EvaluatedBadge[] {
	return ALL_BADGES.map(({ earned, ...rest }) => ({ ...rest, earned: earned(ctx) }));
}
