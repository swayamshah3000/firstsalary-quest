/**
 * Financial engine types.
 *
 * The engine tracks the player's money in real rupees month-by-month. The five
 * game meters are *derived* from this state (see meters.ts) rather than nudged
 * directly — so the numbers behind the game are internally consistent.
 *
 * This module is self-contained (no `$lib` runtime imports) so it can be unit
 * tested in isolation.
 */

/** An outstanding loan / EMI obligation. */
export interface Loan {
	id: string;
	label: string;
	balance: number; // outstanding principal
	annualRate: number; // % per year
	emi: number; // fixed monthly instalment
	monthsLeft: number;
}

/** An active monthly investment (SIP). */
export interface Sip {
	id: string;
	label: string;
	monthly: number;
	annualReturn: number; // % per year, expected
}

/** Insurance cover amounts (sum assured), in rupees. 0 = not held. */
export interface Insurance {
	health: number;
	term: number;
	accident: number;
	criticalIllness: number;
}

/** A point-in-time snapshot, captured each month for charts. */
export interface MonthSnapshot {
	month: number;
	cash: number;
	emergencyFund: number;
	investments: number;
	liabilities: number;
	netWorth: number;
}

/** The full financial state of a play-through. */
export interface FinancialState {
	month: number; // 0 = freshly set up, before month 1 is simulated
	monthlyIncome: number; // take-home salary
	baseExpenses: number; // essential monthly (rent, food, commute, utilities, premiums)
	lifestyleExpenses: number; // discretionary monthly
	cash: number; // liquid bank balance
	emergencyFund: number; // earmarked emergency savings
	investments: number; // SIP / mutual-fund corpus
	investmentReturn: number; // blended annual return on the corpus (%)
	loans: Loan[];
	sips: Sip[];
	insurance: Insurance;
	hasDependents: boolean; // drives whether term insurance matters
	cityTier: 'metro' | 'tier2';
	knowledge: number; // 0-100, learning dimension (quizzes/lessons), not a core meter
	history: MonthSnapshot[];
}

/**
 * The financial consequences of a decision choice. Every field is optional;
 * a choice only sets what it changes. This replaces the old "five raw meter
 * deltas" model — choices now describe real money actions.
 */
export interface DecisionEffects {
	/** One-time cash change (e.g. -75000 to buy a phone outright). */
	cash?: number;
	/** Move this much from cash into the earmarked emergency fund. */
	emergencyFund?: number;
	/** Recurring change to essential monthly expenses (e.g. higher rent, a premium). */
	baseExpenses?: number;
	/** Recurring change to discretionary/lifestyle monthly spend. */
	lifestyleExpenses?: number;
	/** Take on a loan — creates an EMI and a liability (no cash is added). */
	addLoan?: { label: string; principal: number; annualRate: number; months: number };
	/** Start a monthly SIP. */
	startSip?: { label: string; monthly: number; annualReturn: number };
	/** Buy / top-up insurance cover (sum assured per type). */
	insurance?: Partial<Insurance>;
	/** Optional nudge to the learning/knowledge dimension. */
	knowledge?: number;
}

/** The five derived game meters, each 0-100 (higher is always better). */
export interface Meters {
	netWorth: number;
	emergencyFund: number;
	protectionScore: number;
	lifestyleInflation: number; // higher = LESS inflation = better
	financialFreedom: number;
}
