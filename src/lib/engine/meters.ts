import {
	EMERGENCY_FUND_TARGET_MONTHS,
	RECOMMENDED_HEALTH_COVER,
	RESILIENCE_WEIGHTS,
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

	// Net worth: 0 net worth → 50; six months' pay saved → 100; equally negative → 0.
	const netWorth = clamp(50 + (netWorthValue(state) / (income * 6)) * 50);

	// Emergency readiness: months of essentials covered by liquid + earmarked savings.
	const monthsCovered = (state.emergencyFund + Math.max(0, state.cash)) / essentials;
	const emergencyFund = clamp((monthsCovered / EMERGENCY_FUND_TARGET_MONTHS) * 100);

	// Protection: how close insurance cover is to what this profile needs.
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
		// Term insurance isn't a priority without dependents.
		protectionScore = 100 * (0.6 * healthScore + 0.2 * accidentScore + 0.2 * criticalScore);
	}

	// Lifestyle inflation: discretionary spend as a share of income. ~15% is healthy.
	const ratio = state.lifestyleExpenses / income;
	const lifestyleInflation = clamp(100 - Math.max(0, ratio - 0.15) * 300);

	// Financial freedom progress: corpus relative to one year's income.
	const financialFreedom = clamp((state.investments / annualIncome) * 100);

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
