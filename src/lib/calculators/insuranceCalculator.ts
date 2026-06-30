/**
 * Insurance coverage estimator (educational rules of thumb — not advice to buy
 * any specific policy). Suggests ballpark cover amounts for a young earner.
 *
 *   - Health: a baseline by city tier (metros cost more to treat in).
 *   - Term: ~10x annual income, but only meaningful if people depend on you.
 *   - Personal accident: ~10x annual income (protects your earning ability).
 *   - Critical illness: ~5x annual income (lump sum on serious diagnosis).
 */

export type CityTier = 'metro' | 'tier2';

export interface InsuranceInput {
	/** Monthly take-home income. */
	monthlyIncome: number;
	/** City tier (metros recommend higher health cover). */
	cityTier: CityTier;
	/** Whether anyone financially depends on your income. */
	hasDependents: boolean;
}

export interface InsuranceEstimate {
	health: number;
	term: number;
	accident: number;
	criticalIllness: number;
	/** Sum of all recommended covers. */
	total: number;
}

const HEALTH_BY_TIER: Record<CityTier, number> = {
	metro: 500000,
	tier2: 300000
};

export function estimateInsurance({
	monthlyIncome,
	cityTier,
	hasDependents
}: InsuranceInput): InsuranceEstimate {
	const annualIncome = Math.max(0, monthlyIncome) * 12;

	const health = HEALTH_BY_TIER[cityTier];
	const term = hasDependents ? annualIncome * 10 : 0;
	const accident = annualIncome * 10;
	const criticalIllness = annualIncome * 5;

	return {
		health,
		term,
		accident,
		criticalIllness,
		total: health + term + accident + criticalIllness
	};
}
