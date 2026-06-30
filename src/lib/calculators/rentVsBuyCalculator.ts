import { calculateEmi } from './emiCalculator';

/**
 * Simplified rent-vs-buy comparison (educational, not advice).
 *
 * It projects your net worth from this one decision over a horizon:
 *   - BUY  → you build home equity (value − outstanding loan) but spend the
 *            down payment, EMIs and maintenance.
 *   - RENT → you keep the down payment invested and also invest whatever you
 *            save each month by renting instead of paying EMI + maintenance.
 *
 * Simplifications: rent is held flat, taxes/transaction costs are ignored. The
 * point is to show that "buying early" isn't automatically the wealthier path.
 */
export interface RentVsBuyInput {
	homePrice: number;
	downPayment: number;
	/** Home-loan interest rate, annual %. */
	loanRate: number;
	loanTenureYears: number;
	monthlyRent: number;
	/** Expected annual return if you invest instead, %. */
	investmentReturn: number;
	/** Expected annual home price appreciation, %. */
	homeAppreciation: number;
	/** How many years you plan to stay. */
	horizonYears: number;
	/** Annual maintenance as a % of home price (default 1%). */
	maintenancePctAnnual?: number;
}

export interface RentVsBuyResult {
	emi: number;
	/** Net worth from the buy path at the horizon. */
	buyNetWorth: number;
	/** Net worth from the rent-and-invest path at the horizon. */
	rentNetWorth: number;
	/** buyNetWorth − rentNetWorth (positive favours buying). */
	difference: number;
	/** 'Buying' or 'Renting' — whichever ends wealthier in this model. */
	verdict: 'Buying' | 'Renting';
}

export function compareRentVsBuy({
	homePrice,
	downPayment,
	loanRate,
	loanTenureYears,
	monthlyRent,
	investmentReturn,
	homeAppreciation,
	horizonYears,
	maintenancePctAnnual = 1
}: RentVsBuyInput): RentVsBuyResult {
	const principal = Math.max(0, homePrice - downPayment);
	const tenureMonths = Math.max(1, Math.round(loanTenureYears * 12));
	const { emi } = calculateEmi({
		principal,
		annualInterestRate: loanRate,
		tenureMonths
	});

	const horizonMonths = Math.max(0, Math.round(horizonYears * 12));
	const monthlyRateLoan = loanRate / 12 / 100;
	const maintenanceMonthly = (homePrice * (maintenancePctAnnual / 100)) / 12;

	// Amortize the loan over the horizon to find the outstanding balance.
	let balance = principal;
	for (let m = 0; m < horizonMonths && m < tenureMonths; m++) {
		const interest = balance * monthlyRateLoan;
		balance -= emi - interest;
		if (balance < 0) balance = 0;
	}

	const homeValue = homePrice * Math.pow(1 + homeAppreciation / 100, horizonYears);
	const buyNetWorth = homeValue - Math.max(0, balance);

	// Rent path: invest the down payment, plus any monthly saving vs buying.
	const monthlyInvestable = Math.max(0, emi + maintenanceMonthly - monthlyRent);
	const monthlyRateInvest = investmentReturn / 12 / 100;
	let corpus = downPayment;
	for (let m = 0; m < horizonMonths; m++) {
		corpus = corpus * (1 + monthlyRateInvest) + monthlyInvestable;
	}
	const rentNetWorth = corpus;

	const difference = buyNetWorth - rentNetWorth;
	return {
		emi: Math.round(emi),
		buyNetWorth: Math.round(buyNetWorth),
		rentNetWorth: Math.round(rentNetWorth),
		difference: Math.round(difference),
		verdict: difference >= 0 ? 'Buying' : 'Renting'
	};
}
