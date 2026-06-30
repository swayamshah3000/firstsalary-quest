<script lang="ts">
	import { calculateEmergencyFund } from '$lib/calculators/emergencyFundCalculator';
	import { calculateSip, calculateSipForGoal } from '$lib/calculators/sipCalculator';
	import { calculateEmi } from '$lib/calculators/emiCalculator';
	import { estimateInsurance } from '$lib/calculators/insuranceCalculator';
	import { compareRentVsBuy } from '$lib/calculators/rentVsBuyCalculator';

	const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

	// Emergency fund
	let efExpenses = $state(20000);
	let efMonths = $state(6);
	let efSaved = $state(30000);
	const ef = $derived(
		calculateEmergencyFund({
			monthlyExpenses: efExpenses,
			targetMonths: efMonths,
			currentSavings: efSaved
		})
	);

	// SIP
	let sipAmount = $state(5000);
	let sipReturn = $state(12);
	let sipYears = $state(10);
	const sip = $derived(
		calculateSip({ monthlyInvestment: sipAmount, annualReturnRate: sipReturn, years: sipYears })
	);

	// EMI
	let emiPrincipal = $state(80000);
	let emiRate = $state(14);
	let emiTenure = $state(12);
	const emi = $derived(
		calculateEmi({
			principal: emiPrincipal,
			annualInterestRate: emiRate,
			tenureMonths: emiTenure
		})
	);

	// SIP goal
	let goalTarget = $state(500000);
	let goalReturn = $state(12);
	let goalYears = $state(3);
	const goal = $derived(
		calculateSipForGoal({ targetAmount: goalTarget, annualReturnRate: goalReturn, years: goalYears })
	);

	// Insurance estimate
	let insIncome = $state(50000);
	let insTier = $state<'metro' | 'tier2'>('metro');
	let insDeps = $state(false);
	const ins = $derived(
		estimateInsurance({ monthlyIncome: insIncome, cityTier: insTier, hasDependents: insDeps })
	);

	// Rent vs buy
	let rbPrice = $state(5000000);
	let rbDown = $state(1000000);
	let rbRate = $state(9);
	let rbTenure = $state(20);
	let rbRent = $state(18000);
	let rbReturn = $state(11);
	let rbAppr = $state(6);
	let rbHorizon = $state(7);
	const rb = $derived(
		compareRentVsBuy({
			homePrice: rbPrice,
			downPayment: rbDown,
			loanRate: rbRate,
			loanTenureYears: rbTenure,
			monthlyRent: rbRent,
			investmentReturn: rbReturn,
			homeAppreciation: rbAppr,
			horizonYears: rbHorizon
		})
	);
</script>

<h1>Calculators</h1>
<p class="sub">Play with the numbers behind the game's money decisions.</p>

<div class="grid">
	<!-- Emergency fund -->
	<section class="calc">
		<h2>🛟 Emergency Fund</h2>
		<label>Monthly expenses (₹)<input type="number" bind:value={efExpenses} /></label>
		<label>Target months<input type="number" bind:value={efMonths} /></label>
		<label>Already saved (₹)<input type="number" bind:value={efSaved} /></label>
		<div class="out">
			<div><span>Target</span><strong>{inr(ef.targetAmount)}</strong></div>
			<div><span>Shortfall</span><strong>{inr(ef.shortfall)}</strong></div>
			<div><span>Funded</span><strong>{ef.percentFunded}%</strong></div>
		</div>
	</section>

	<!-- SIP -->
	<section class="calc">
		<h2>📈 SIP Growth</h2>
		<label>Monthly investment (₹)<input type="number" bind:value={sipAmount} /></label>
		<label>Expected return (% p.a.)<input type="number" bind:value={sipReturn} /></label>
		<label>Years<input type="number" bind:value={sipYears} /></label>
		<div class="out">
			<div><span>Invested</span><strong>{inr(sip.investedAmount)}</strong></div>
			<div><span>Est. returns</span><strong>{inr(sip.estimatedReturns)}</strong></div>
			<div><span>Future value</span><strong>{inr(sip.futureValue)}</strong></div>
		</div>
	</section>

	<!-- EMI -->
	<section class="calc">
		<h2>💳 Loan EMI</h2>
		<label>Loan amount (₹)<input type="number" bind:value={emiPrincipal} /></label>
		<label>Interest (% p.a.)<input type="number" bind:value={emiRate} /></label>
		<label>Tenure (months)<input type="number" bind:value={emiTenure} /></label>
		<div class="out">
			<div><span>Monthly EMI</span><strong>{inr(emi.emi)}</strong></div>
			<div><span>Total interest</span><strong>{inr(emi.totalInterest)}</strong></div>
			<div><span>Total paid</span><strong>{inr(emi.totalPayment)}</strong></div>
		</div>
	</section>

	<!-- SIP goal -->
	<section class="calc">
		<h2>🎯 SIP for a Goal</h2>
		<label>Goal amount (₹)<input type="number" bind:value={goalTarget} /></label>
		<label>Expected return (% p.a.)<input type="number" bind:value={goalReturn} /></label>
		<label>Years to goal<input type="number" bind:value={goalYears} /></label>
		<div class="out">
			<div><span>Monthly SIP needed</span><strong>{inr(goal.monthlyInvestment)}</strong></div>
			<div><span>You invest</span><strong>{inr(goal.investedAmount)}</strong></div>
			<div><span>From growth</span><strong>{inr(goal.estimatedReturns)}</strong></div>
		</div>
	</section>

	<!-- Insurance estimate -->
	<section class="calc">
		<h2>🛡️ Insurance Estimator</h2>
		<label>Monthly income (₹)<input type="number" bind:value={insIncome} /></label>
		<label>
			City type
			<select bind:value={insTier}>
				<option value="metro">Metro</option>
				<option value="tier2">Tier-2 / smaller</option>
			</select>
		</label>
		<label class="check">
			<input type="checkbox" bind:checked={insDeps} /> People depend on my income
		</label>
		<div class="out">
			<div><span>Health cover</span><strong>{inr(ins.health)}</strong></div>
			<div><span>Term cover</span><strong>{ins.term ? inr(ins.term) : 'Not urgent'}</strong></div>
			<div><span>Accident cover</span><strong>{inr(ins.accident)}</strong></div>
			<div><span>Critical illness</span><strong>{inr(ins.criticalIllness)}</strong></div>
		</div>
	</section>

	<!-- Rent vs buy -->
	<section class="calc wide">
		<h2>🏠 Rent vs Buy</h2>
		<div class="row">
			<label>Home price (₹)<input type="number" bind:value={rbPrice} /></label>
			<label>Down payment (₹)<input type="number" bind:value={rbDown} /></label>
			<label>Loan rate (% p.a.)<input type="number" bind:value={rbRate} /></label>
			<label>Loan tenure (yrs)<input type="number" bind:value={rbTenure} /></label>
			<label>Monthly rent (₹)<input type="number" bind:value={rbRent} /></label>
			<label>Invest return (% p.a.)<input type="number" bind:value={rbReturn} /></label>
			<label>Home appreciation (% p.a.)<input type="number" bind:value={rbAppr} /></label>
			<label>Years you'll stay<input type="number" bind:value={rbHorizon} /></label>
		</div>
		<div class="verdict" class:buy={rb.verdict === 'Buying'}>
			Over {rbHorizon} years, <strong>{rb.verdict}</strong> looks wealthier in this simplified model.
		</div>
		<div class="out three">
			<div><span>Monthly EMI</span><strong>{inr(rb.emi)}</strong></div>
			<div><span>Buy net worth</span><strong>{inr(rb.buyNetWorth)}</strong></div>
			<div><span>Rent + invest net worth</span><strong>{inr(rb.rentNetWorth)}</strong></div>
		</div>
	</section>
</div>

<p class="page-disclaimer">
	🎓 Estimates for learning only — rules of thumb, not financial advice. No specific
	product is recommended.
</p>

<style>
	.sub {
		color: #52606d;
		margin-top: 0;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 1rem;
	}
	.calc {
		background: #fff;
		border: 1px solid #e4e7eb;
		border-radius: 0.75rem;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.calc h2 {
		margin: 0;
		font-size: 1.1rem;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: #3e4c59;
	}
	input {
		padding: 0.45rem;
		border: 1px solid #cbd2d9;
		border-radius: 0.4rem;
		font-size: 0.95rem;
	}
	.out {
		margin-top: 0.5rem;
		border-top: 1px dashed #e4e7eb;
		padding-top: 0.6rem;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.out div {
		display: flex;
		justify-content: space-between;
		font-size: 0.9rem;
	}
	.out span {
		color: #52606d;
	}
	.out strong {
		color: #1f2933;
	}
	.calc.wide {
		grid-column: 1 / -1;
	}
	select {
		padding: 0.45rem;
		border: 1px solid #cbd2d9;
		border-radius: 0.4rem;
		font-size: 0.95rem;
	}
	label.check {
		flex-direction: row;
		align-items: center;
		gap: 0.4rem;
	}
	label.check input {
		width: auto;
	}
	.row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 0.6rem;
	}
	.out.three {
		flex-direction: row;
		flex-wrap: wrap;
		gap: 1.5rem;
	}
	.out.three div {
		flex-direction: column;
		gap: 0.1rem;
	}
	.verdict {
		margin-top: 0.6rem;
		padding: 0.6rem 0.8rem;
		border-radius: 0.5rem;
		background: #fff7e6;
		border: 1px solid #f0d089;
		color: #7a5a12;
		font-size: 0.95rem;
	}
	.verdict.buy {
		background: #e3f2e9;
		border-color: #b6e0c6;
		color: #1f7a45;
	}
	.page-disclaimer {
		margin-top: 1.5rem;
		font-size: 0.8rem;
		color: #7a5a12;
		text-align: center;
	}
</style>
