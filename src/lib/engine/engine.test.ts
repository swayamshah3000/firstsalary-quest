import { describe, it, expect } from 'vitest';
import type { UserProfile } from '$lib/schemas';
import {
	createInitialState,
	applyEffects,
	advanceMonth,
	computeMeters,
	resilienceScore,
	resilienceBand,
	netWorthValue,
	type FinancialState,
	type Meters
} from './index';

const baseProfile: UserProfile = {
	name: 'Aarav',
	city: 'Bengaluru',
	salary: 50000,
	familyDependency: 'none',
	jobType: 'salaried'
};

/** Run the month tick `n` times. */
function runMonths(state: FinancialState, n: number): FinancialState {
	let s = state;
	for (let i = 0; i < n; i++) s = advanceMonth(s);
	return s;
}

/** Every meter must always be a 0-100 integer. */
function expectMetersInRange(meters: Meters) {
	for (const value of Object.values(meters)) {
		expect(value).toBeGreaterThanOrEqual(0);
		expect(value).toBeLessThanOrEqual(100);
		expect(Number.isInteger(value)).toBe(true);
	}
}

describe('initial state', () => {
	it('sets sensible starting numbers from the profile', () => {
		const s = createInitialState(baseProfile);
		expect(s.monthlyIncome).toBe(50000);
		expect(s.baseExpenses).toBe(20000); // Bengaluru essentials, no family support
		expect(s.lifestyleExpenses).toBe(6000); // 12% of salary
		expect(s.investments).toBe(0);
		expect(s.loans).toHaveLength(0);
		expectMetersInRange(computeMeters(s));
	});

	it('adds family-support costs for dependents', () => {
		const withFamily = createInitialState({ ...baseProfile, familyDependency: 'high' });
		expect(withFamily.baseExpenses).toBeGreaterThan(20000);
		expect(withFamily.hasDependents).toBe(true);
	});
});

describe('saving over time (no decisions)', () => {
	it('grows cash and net worth, lifting the emergency meter', () => {
		const start = createInitialState(baseProfile);
		const end = runMonths(start, 12);

		expect(end.month).toBe(12);
		expect(end.cash).toBeGreaterThan(start.cash);
		expect(netWorthValue(end)).toBeGreaterThan(0);
		expect(end.history).toHaveLength(12);
		expect(computeMeters(end).emergencyFund).toBeGreaterThan(
			computeMeters(start).emergencyFund
		);
	});
});

describe('taking an EMI loan', () => {
	it('creates a liability that amortizes to zero by the end of the tenure', () => {
		const start = createInitialState(baseProfile);
		const withLoan = applyEffects(start, {
			addLoan: { label: 'Phone EMI', principal: 60000, annualRate: 14, months: 12 },
			lifestyleExpenses: 500
		});
		expect(withLoan.loans).toHaveLength(1);
		expect(netWorthValue(withLoan)).toBeLessThan(netWorthValue(start));

		const end = runMonths(withLoan, 12);
		expect(end.loans).toHaveLength(0); // fully paid off
	});
});

describe('buying health insurance', () => {
	it('raises the protection meter', () => {
		const start = createInitialState(baseProfile);
		const before = computeMeters(start).protectionScore;
		const insured = applyEffects(start, {
			insurance: { health: 500000 },
			baseExpenses: 600 // premium
		});
		const after = computeMeters(insured).protectionScore;
		expect(after).toBeGreaterThan(before);
	});
});

describe('starting a SIP', () => {
	it('compounds the corpus above total contributions and lifts financial freedom', () => {
		const start = createInitialState(baseProfile);
		const investing = applyEffects(start, {
			startSip: { label: 'Index SIP', monthly: 5000, annualReturn: 12 }
		});
		const end = runMonths(investing, 12);

		expect(end.investments).toBeGreaterThan(60000); // 12 × 5000 + growth
		expect(end.investments).toBeLessThan(70000);
		expect(computeMeters(end).financialFreedom).toBeGreaterThan(
			computeMeters(start).financialFreedom
		);
	});
});

describe('lifestyle inflation', () => {
	it('drops the lifestyle meter when discretionary spend balloons', () => {
		const start = createInitialState(baseProfile);
		const splurging = applyEffects(start, { lifestyleExpenses: 20000 });
		expect(computeMeters(splurging).lifestyleInflation).toBeLessThan(
			computeMeters(start).lifestyleInflation
		);
		expect(computeMeters(splurging).lifestyleInflation).toBeLessThan(20);
	});
});

describe('resilience score', () => {
	it('stays within 0-100 and maps to a band', () => {
		const s = createInitialState(baseProfile);
		const score = resilienceScore(computeMeters(s));
		expect(score).toBeGreaterThanOrEqual(0);
		expect(score).toBeLessThanOrEqual(100);
		expect(typeof resilienceBand(score)).toBe('string');
	});

	it('keeps meters clamped even with deeply negative net worth', () => {
		const start = createInitialState(baseProfile);
		const broke = applyEffects(start, {
			addLoan: { label: 'Huge loan', principal: 2000000, annualRate: 20, months: 60 }
		});
		expectMetersInRange(computeMeters(broke));
		expect(computeMeters(broke).netWorth).toBe(0); // floored, not negative
	});
});
