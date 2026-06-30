/**
 * Emergency fund calculator.
 *
 * Educational rule of thumb: keep 3-6 months of essential expenses set aside.
 * All amounts are in the same currency unit (INR in this app).
 */

export interface EmergencyFundInput {
	/** Essential monthly expenses (rent, food, bills, EMIs). */
	monthlyExpenses: number;
	/** How many months of cover you want (commonly 3-6). */
	targetMonths?: number;
	/** How much you have already set aside. */
	currentSavings?: number;
}

export interface EmergencyFundResult {
	/** The amount you are aiming for. */
	targetAmount: number;
	/** How much more you still need (0 if already funded). */
	shortfall: number;
	/** Months of expenses your current savings already cover. */
	monthsCovered: number;
	/** Progress toward the target, 0-100. */
	percentFunded: number;
	/** True once currentSavings >= targetAmount. */
	isFunded: boolean;
}

export function calculateEmergencyFund({
	monthlyExpenses,
	targetMonths = 6,
	currentSavings = 0
}: EmergencyFundInput): EmergencyFundResult {
	const expenses = Math.max(0, monthlyExpenses);
	const months = Math.max(0, targetMonths);
	const saved = Math.max(0, currentSavings);

	const targetAmount = expenses * months;
	const shortfall = Math.max(0, targetAmount - saved);
	const monthsCovered = expenses > 0 ? saved / expenses : 0;
	const percentFunded = targetAmount > 0 ? Math.min(100, (saved / targetAmount) * 100) : 100;

	return {
		targetAmount: round(targetAmount),
		shortfall: round(shortfall),
		monthsCovered: round(monthsCovered, 1),
		percentFunded: round(percentFunded, 1),
		isFunded: saved >= targetAmount
	};
}

function round(value: number, dp = 0): number {
	const f = 10 ** dp;
	return Math.round(value * f) / f;
}
