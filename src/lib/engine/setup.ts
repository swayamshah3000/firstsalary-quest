import type { UserProfile } from '$lib/schemas';
import {
	CITIES,
	DEFAULT_CITY,
	FAMILY_SUPPORT_FRACTION,
	STARTING_LIFESTYLE_FRACTION
} from './config';
import type { FinancialState } from './types';

/**
 * Build the starting financial state from the player's character.
 *
 * The fresher starts with a thin cash cushion, no investments, no insurance and
 * no debt — the whole game is about improving that position over 12 months.
 */
export function createInitialState(profile: UserProfile): FinancialState {
	const city = CITIES[profile.city] ?? DEFAULT_CITY;
	const income = profile.salary;

	const familySupport =
		profile.familyDependency === 'none' ? 0 : Math.round(income * FAMILY_SUPPORT_FRACTION);

	const baseExpenses = city.essentials + familySupport;
	const lifestyleExpenses = Math.round(income * STARTING_LIFESTYLE_FRACTION);

	return {
		month: 0,
		monthlyIncome: income,
		baseExpenses,
		lifestyleExpenses,
		// A first earner typically starts with little buffer — half a month of pay.
		cash: Math.round(income * 0.5),
		emergencyFund: 0,
		investments: 0,
		investmentReturn: 0,
		loans: [],
		sips: [],
		insurance: { health: 0, term: 0, accident: 0, criticalIllness: 0 },
		hasDependents: profile.familyDependency === 'high',
		cityTier: city.tier,
		knowledge: 50,
		history: []
	};
}
