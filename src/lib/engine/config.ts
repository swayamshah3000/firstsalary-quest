/**
 * Tunable assumptions for the simulation. All money is in INR.
 *
 * These are deliberately rough, teaching-grade defaults (not precise economic
 * data) — they make the game feel plausible while staying easy to reason about.
 */

export type CityTier = 'metro' | 'tier2';

interface CityProfile {
	tier: CityTier;
	/** Baseline essential monthly spend for a single fresher (shared/PG living). */
	essentials: number;
}

/** Per-city baseline essentials + tier. Falls back to DEFAULT_CITY if unknown. */
export const CITIES: Record<string, CityProfile> = {
	Mumbai: { tier: 'metro', essentials: 24000 },
	Delhi: { tier: 'metro', essentials: 21000 },
	Bengaluru: { tier: 'metro', essentials: 20000 },
	Hyderabad: { tier: 'tier2', essentials: 16000 },
	Pune: { tier: 'tier2', essentials: 17000 },
	Chennai: { tier: 'tier2', essentials: 16000 },
	Kolkata: { tier: 'tier2', essentials: 14000 }
};

export const DEFAULT_CITY: CityProfile = { tier: 'tier2', essentials: 16000 };

/** Starting discretionary spend, as a fraction of take-home salary. */
export const STARTING_LIFESTYLE_FRACTION = 0.12;

/** Extra essential spend when the player supports family, as a fraction of salary. */
export const FAMILY_SUPPORT_FRACTION = 0.15;

/** Interest earned on the emergency fund (annual %). */
export const EMERGENCY_FUND_RATE = 4;

/** Default blended portfolio return once the player starts investing (annual %). */
export const DEFAULT_INVESTMENT_RETURN = 11;

/** Recommended health cover (sum assured) by city tier. */
export const RECOMMENDED_HEALTH_COVER: Record<CityTier, number> = {
	metro: 500000,
	tier2: 300000
};

/** Term cover rule of thumb: this many times annual income (only if dependents). */
export const TERM_COVER_INCOME_MULTIPLE = 10;

/** Real-world "full" emergency fund target (used in lessons/copy): 6 months. */
export const EMERGENCY_FUND_TARGET_MONTHS = 6;

/**
 * Score calibration — tuned so a *good 12-month run* can reach a high score.
 *
 * The meters can't use lifetime targets (6 months saved, a whole year's income
 * invested) because nobody can reach those in one year on a starting salary — so
 * even perfect play would look like failure. These are the milestones a strong
 * *first year* can realistically hit, and each maps to a meter score of 100.
 */
export const SCORE_CALIBRATION = {
	/** Net worth of this many months' income → net-worth meter 100. */
	netWorthFullMonths: 4,
	/** Emergency savings covering this many months of essentials → meter 100. */
	emergencyFullMonths: 3,
	/** Invested corpus of this many months' income → financial-freedom meter 100. */
	freedomFullMonths: 2
} as const;

/** Weights for blending the five meters into the Financial Resilience Score. */
export const RESILIENCE_WEIGHTS = {
	protectionScore: 0.25,
	emergencyFund: 0.25,
	netWorth: 0.2,
	financialFreedom: 0.2,
	lifestyleInflation: 0.1
} as const;
