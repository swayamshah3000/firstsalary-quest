/**
 * SIP (Systematic Investment Plan) future-value calculator.
 *
 * Estimates what a fixed monthly investment could grow to, assuming a constant
 * annual return compounded monthly. This is a teaching estimate, not a forecast
 * or a guarantee — real returns vary.
 *
 *   FV = P * [ (((1 + i)^n - 1) / i) * (1 + i) ]
 *   where i = monthly rate, n = number of monthly instalments.
 */

export interface SipInput {
	/** Amount invested every month. */
	monthlyInvestment: number;
	/** Expected annual return, as a percentage (e.g. 12 for 12%). */
	annualReturnRate: number;
	/** Investment horizon in years. */
	years: number;
}

export interface SipResult {
	/** Total of all your monthly contributions. */
	investedAmount: number;
	/** Estimated value at the end of the horizon. */
	futureValue: number;
	/** futureValue - investedAmount (the growth). */
	estimatedReturns: number;
}

export function calculateSip({
	monthlyInvestment,
	annualReturnRate,
	years
}: SipInput): SipResult {
	const p = Math.max(0, monthlyInvestment);
	const n = Math.max(0, Math.round(years * 12));
	const i = annualReturnRate / 100 / 12;

	const investedAmount = p * n;

	let futureValue: number;
	if (n === 0) {
		futureValue = 0;
	} else if (i === 0) {
		// No growth: future value is just what you put in.
		futureValue = investedAmount;
	} else {
		futureValue = p * (((Math.pow(1 + i, n) - 1) / i) * (1 + i));
	}

	return {
		investedAmount: round(investedAmount),
		futureValue: round(futureValue),
		estimatedReturns: round(futureValue - investedAmount)
	};
}

export interface SipGoalInput {
	/** The amount you want to reach. */
	targetAmount: number;
	/** Expected annual return, as a percentage. */
	annualReturnRate: number;
	/** Years available to reach the goal. */
	years: number;
}

export interface SipGoalResult {
	/** Monthly SIP needed to reach the target. */
	monthlyInvestment: number;
	/** Total you'd contribute over the period. */
	investedAmount: number;
	/** The portion expected to come from growth. */
	estimatedReturns: number;
}

/**
 * Inverse of calculateSip: the monthly SIP required to reach a target amount in
 * a given number of years at an expected return. Useful for goal planning
 * (e.g. "how much per month for a ₹5L goal in 3 years?").
 */
export function calculateSipForGoal({
	targetAmount,
	annualReturnRate,
	years
}: SipGoalInput): SipGoalResult {
	const fv = Math.max(0, targetAmount);
	const n = Math.max(0, Math.round(years * 12));
	const i = annualReturnRate / 100 / 12;

	let monthlyInvestment: number;
	if (n === 0) {
		monthlyInvestment = 0;
	} else if (i === 0) {
		monthlyInvestment = fv / n;
	} else {
		monthlyInvestment = fv / (((Math.pow(1 + i, n) - 1) / i) * (1 + i));
	}

	const investedAmount = monthlyInvestment * n;
	return {
		monthlyInvestment: round(monthlyInvestment),
		investedAmount: round(investedAmount),
		estimatedReturns: round(fv - investedAmount)
	};
}

function round(value: number, dp = 0): number {
	const f = 10 ** dp;
	return Math.round(value * f) / f;
}
