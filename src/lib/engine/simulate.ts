import { calculateEmi } from '$lib/calculators/emiCalculator';
import { DEFAULT_INVESTMENT_RETURN, EMERGENCY_FUND_RATE } from './config';
import { netWorthValue, totalLiabilities } from './meters';
import type { DecisionEffects, FinancialState, Loan, MonthSnapshot, Sip } from './types';

let counter = 0;
/** Deterministic-enough id for a loan/sip created during play. */
function nextId(prefix: string): string {
	counter += 1;
	return `${prefix}-${counter}`;
}

/** Shallow-clone state so the engine stays pure (no input mutation). */
function cloneState(state: FinancialState): FinancialState {
	return {
		...state,
		insurance: { ...state.insurance },
		loans: state.loans.map((l) => ({ ...l })),
		sips: state.sips.map((s) => ({ ...s })),
		history: [...state.history]
	};
}

/**
 * Apply a decision's financial effects, returning a new state. Effects describe
 * real actions (loans, SIPs, insurance, expense changes) — not raw meter nudges.
 */
export function applyEffects(state: FinancialState, effects: DecisionEffects): FinancialState {
	const next = cloneState(state);

	if (effects.cash) next.cash += effects.cash;

	if (effects.emergencyFund) {
		next.emergencyFund += effects.emergencyFund;
		next.cash -= effects.emergencyFund;
	}

	if (effects.baseExpenses) next.baseExpenses += effects.baseExpenses;
	if (effects.lifestyleExpenses) next.lifestyleExpenses += effects.lifestyleExpenses;

	if (effects.addLoan) {
		const { label, principal, annualRate, months } = effects.addLoan;
		const { emi } = calculateEmi({ principal, annualInterestRate: annualRate, tenureMonths: months });
		const loan: Loan = { id: nextId('loan'), label, balance: principal, annualRate, emi, monthsLeft: months };
		next.loans = [...next.loans, loan];
	}

	if (effects.startSip) {
		const sip: Sip = { id: nextId('sip'), ...effects.startSip };
		next.sips = [...next.sips, sip];
		// Once investing, the corpus earns a blended market return.
		next.investmentReturn = next.investmentReturn || DEFAULT_INVESTMENT_RETURN;
	}

	if (effects.insurance) {
		next.insurance = { ...next.insurance, ...effects.insurance };
	}

	if (effects.knowledge) {
		next.knowledge = Math.min(100, Math.max(0, next.knowledge + effects.knowledge));
	}

	return next;
}

/**
 * Simulate one month: income arrives, expenses and EMIs are paid, SIPs are
 * contributed, and the investment corpus and emergency fund grow. Returns a new
 * state with `month` incremented and a snapshot appended to `history`.
 */
export function advanceMonth(state: FinancialState): FinancialState {
	const next = cloneState(state);

	// 1. Income in, living costs out.
	next.cash += next.monthlyIncome;
	next.cash -= next.baseExpenses;
	next.cash -= next.lifestyleExpenses;

	// 2. Pay EMIs (interest first, then principal).
	next.loans = next.loans
		.map((loan) => {
			if (loan.monthsLeft <= 0 || loan.balance <= 0) return loan;
			const monthlyRate = loan.annualRate / 12 / 100;
			const interest = loan.balance * monthlyRate;
			let principalPaid = loan.emi - interest;
			let payment = loan.emi;
			// On the final scheduled instalment (or if the EMI would overshoot),
			// settle the whole remaining balance — avoids rounding residue.
			if (loan.monthsLeft <= 1 || principalPaid >= loan.balance) {
				principalPaid = loan.balance;
				payment = loan.balance + interest;
			}
			next.cash -= payment;
			return { ...loan, balance: loan.balance - principalPaid, monthsLeft: loan.monthsLeft - 1 };
		})
		.filter((loan) => loan.balance > 0.5);

	// 3. Grow the existing corpus, then add this month's SIP contributions.
	const monthlyReturn = next.investmentReturn / 12 / 100;
	next.investments *= 1 + monthlyReturn;
	const sipTotal = next.sips.reduce((sum, sip) => sum + sip.monthly, 0);
	if (sipTotal > 0) {
		next.investments += sipTotal;
		next.cash -= sipTotal;
	}

	// 4. Emergency fund earns a little interest.
	next.emergencyFund *= 1 + EMERGENCY_FUND_RATE / 12 / 100;

	// 5. Round money fields and record the snapshot.
	next.cash = round(next.cash);
	next.investments = round(next.investments);
	next.emergencyFund = round(next.emergencyFund);
	next.month += 1;

	const snapshot: MonthSnapshot = {
		month: next.month,
		cash: next.cash,
		emergencyFund: next.emergencyFund,
		investments: next.investments,
		liabilities: round(totalLiabilities(next)),
		netWorth: round(netWorthValue(next))
	};
	next.history = [...next.history, snapshot];

	return next;
}

function round(value: number): number {
	return Math.round(value);
}
