/**
 * EMI (Equated Monthly Instalment) calculator for a loan.
 *
 *   EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
 *   where P = principal, r = monthly interest rate, n = tenure in months.
 *
 * Use it to show the *true* monthly cost — and total interest — behind a
 * tempting "easy EMI" offer.
 */

export interface EmiInput {
	/** Loan amount borrowed. */
	principal: number;
	/** Annual interest rate as a percentage (e.g. 14 for 14%). */
	annualInterestRate: number;
	/** Loan tenure in months. */
	tenureMonths: number;
}

export interface EmiResult {
	/** The fixed monthly instalment. */
	emi: number;
	/** Sum of all instalments over the tenure. */
	totalPayment: number;
	/** totalPayment - principal (the cost of borrowing). */
	totalInterest: number;
}

export function calculateEmi({
	principal,
	annualInterestRate,
	tenureMonths
}: EmiInput): EmiResult {
	const p = Math.max(0, principal);
	const n = Math.max(0, Math.round(tenureMonths));
	const r = annualInterestRate / 100 / 12;

	let emi: number;
	if (n === 0) {
		emi = 0;
	} else if (r === 0) {
		// Interest-free: just split the principal evenly.
		emi = p / n;
	} else {
		const factor = Math.pow(1 + r, n);
		emi = (p * r * factor) / (factor - 1);
	}

	const totalPayment = emi * n;

	return {
		emi: round(emi),
		totalPayment: round(totalPayment),
		totalInterest: round(totalPayment - p)
	};
}

function round(value: number, dp = 0): number {
	const f = 10 ** dp;
	return Math.round(value * f) / f;
}
