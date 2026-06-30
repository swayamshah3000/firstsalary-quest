import { describe, it, expect } from 'vitest';
import { calculateEmergencyFund } from './emergencyFundCalculator';
import { calculateSip, calculateSipForGoal } from './sipCalculator';
import { calculateEmi } from './emiCalculator';
import { estimateInsurance } from './insuranceCalculator';
import { compareRentVsBuy } from './rentVsBuyCalculator';

describe('emergency fund', () => {
	it('computes target, shortfall and funded %', () => {
		const r = calculateEmergencyFund({ monthlyExpenses: 20000, targetMonths: 6, currentSavings: 60000 });
		expect(r.targetAmount).toBe(120000);
		expect(r.shortfall).toBe(60000);
		expect(r.percentFunded).toBe(50);
		expect(r.isFunded).toBe(false);
	});
});

describe('SIP growth', () => {
	it('future value exceeds contributions when return > 0', () => {
		const r = calculateSip({ monthlyInvestment: 5000, annualReturnRate: 12, years: 10 });
		expect(r.investedAmount).toBe(600000);
		expect(r.futureValue).toBeGreaterThan(r.investedAmount);
	});
	it('no growth means future value equals contributions', () => {
		const r = calculateSip({ monthlyInvestment: 1000, annualReturnRate: 0, years: 2 });
		expect(r.futureValue).toBe(r.investedAmount);
	});
});

describe('SIP for a goal', () => {
	it('the solved monthly SIP grows back to roughly the target', () => {
		const target = 500000;
		const goal = calculateSipForGoal({ targetAmount: target, annualReturnRate: 12, years: 3 });
		expect(goal.monthlyInvestment).toBeGreaterThan(0);
		const check = calculateSip({
			monthlyInvestment: goal.monthlyInvestment,
			annualReturnRate: 12,
			years: 3
		});
		// Round-trip should land within ~1% of the target.
		expect(Math.abs(check.futureValue - target)).toBeLessThan(target * 0.01);
	});
});

describe('EMI', () => {
	it('total interest is positive for a normal loan', () => {
		const r = calculateEmi({ principal: 100000, annualInterestRate: 12, tenureMonths: 12 });
		expect(r.emi).toBeGreaterThan(0);
		expect(r.totalInterest).toBeGreaterThan(0);
		expect(r.totalPayment).toBeGreaterThan(100000);
	});
	it('zero interest splits principal evenly', () => {
		const r = calculateEmi({ principal: 12000, annualInterestRate: 0, tenureMonths: 12 });
		expect(r.emi).toBe(1000);
		expect(r.totalInterest).toBe(0);
	});
});

describe('insurance estimate', () => {
	it('recommends no term cover without dependents, and more for metros', () => {
		const single = estimateInsurance({ monthlyIncome: 50000, cityTier: 'metro', hasDependents: false });
		expect(single.term).toBe(0);
		expect(single.health).toBe(500000);

		const tier2 = estimateInsurance({ monthlyIncome: 50000, cityTier: 'tier2', hasDependents: true });
		expect(tier2.health).toBe(300000);
		expect(tier2.term).toBe(50000 * 12 * 10);
		expect(tier2.total).toBeGreaterThan(tier2.health);
	});
});

describe('rent vs buy', () => {
	it('returns sane numbers and a verdict', () => {
		const r = compareRentVsBuy({
			homePrice: 5000000,
			downPayment: 1000000,
			loanRate: 9,
			loanTenureYears: 20,
			monthlyRent: 18000,
			investmentReturn: 11,
			homeAppreciation: 6,
			horizonYears: 7
		});
		expect(r.emi).toBeGreaterThan(0);
		expect(['Buying', 'Renting']).toContain(r.verdict);
		expect(r.difference).toBe(r.buyNetWorth - r.rentNetWorth);
	});
});
