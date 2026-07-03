import {
	RECOMMENDED_HEALTH_COVER,
	RESILIENCE_WEIGHTS,
	SCORE_CALIBRATION,
	TERM_COVER_INCOME_MULTIPLE
} from './config';
import type { FinancialState, Meters } from './types';

function clamp(value: number, min = 0, max = 100): number {
	return Math.min(max, Math.max(min, value));
}

/** Total outstanding liabilities. */
export function totalLiabilities(state: FinancialState): number {
	return state.loans.reduce((sum, loan) => sum + loan.balance, 0);
}

/** Net worth in rupees: assets minus liabilities. */
export function netWorthValue(state: FinancialState): number {
	return state.cash + state.emergencyFund + state.investments - totalLiabilities(state);
}

/**
 * Derive the five 0-100 meters from the real financial state.
 * Every meter is oriented so that higher is better.
 */
export function computeMeters(state: FinancialState): Meters {
	const income = state.monthlyIncome;
	const annualIncome = income * 12;
	const essentials = Math.max(1, state.baseExpenses);
	const cal = SCORE_CALIBRATION;

	// Net worth: 0 → 50; a strong first-year net worth (a few months' pay) → 100;
	// equally negative → 0.
	const netWorth = clamp(50 + (netWorthValue(state) / (income * cal.netWorthFullMonths)) * 50);

	// Emergency readiness: months of essentials covered by liquid + earmarked savings.
	const monthsCovered = (state.emergencyFund + Math.max(0, state.cash)) / essentials;
	const emergencyFund = clamp((monthsCovered / cal.emergencyFullMonths) * 100);

	// Protection: how close insurance cover is to what this profile needs. Buying
	// even one relevant cover should move the meter meaningfully.
	const ins = state.insurance;
	const healthScore = clamp(ins.health / RECOMMENDED_HEALTH_COVER[state.cityTier], 0, 1);
	const accidentScore = ins.accident > 0 ? 1 : 0;
	const criticalScore = ins.criticalIllness > 0 ? 1 : 0;
	let protectionScore: number;
	if (state.hasDependents) {
		const termScore = clamp(ins.term / (annualIncome * TERM_COVER_INCOME_MULTIPLE), 0, 1);
		protectionScore =
			100 * (0.4 * healthScore + 0.3 * termScore + 0.15 * accidentScore + 0.15 * criticalScore);
	} else {
		// No dependents: health is the priority (0.6). Health + one more relevant
		// cover reaches 80 (the "Fully Protected" milestone); all three → 100.
		protectionScore = 100 * (0.6 * healthScore + 0.2 * accidentScore + 0.2 * criticalScore);
	}

	// Lifestyle inflation: discretionary spend as a share of income. ~15% is healthy.
	const ratio = state.lifestyleExpenses / income;
	const lifestyleInflation = clamp(100 - Math.max(0, ratio - 0.15) * 300);

	// Financial freedom progress: invested corpus relative to a strong first-year
	// milestone (a couple of months' income invested), not a whole year's income.
	const financialFreedom = clamp((state.investments / (income * cal.freedomFullMonths)) * 100);

	return {
		netWorth: Math.round(netWorth),
		emergencyFund: Math.round(emergencyFund),
		protectionScore: Math.round(protectionScore),
		lifestyleInflation: Math.round(lifestyleInflation),
		financialFreedom: Math.round(financialFreedom)
	};
}

/** Blend the five meters into a single 0-100 Financial Resilience Score. */
export function resilienceScore(meters: Meters): number {
	const score =
		meters.protectionScore * RESILIENCE_WEIGHTS.protectionScore +
		meters.emergencyFund * RESILIENCE_WEIGHTS.emergencyFund +
		meters.netWorth * RESILIENCE_WEIGHTS.netWorth +
		meters.financialFreedom * RESILIENCE_WEIGHTS.financialFreedom +
		meters.lifestyleInflation * RESILIENCE_WEIGHTS.lifestyleInflation;
	return Math.round(score);
}

/** A short, non-advisory verdict band for the final share card. */
export function resilienceBand(score: number): string {
	if (score >= 80) return 'Financially Resilient';
	if (score >= 65) return 'On Track';
	if (score >= 45) return 'Getting There';
	if (score >= 25) return 'Fragile';
	return 'High Risk';
}
