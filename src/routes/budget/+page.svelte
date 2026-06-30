<script lang="ts">
	import { userProfile } from '$lib/stores/gameStore';

	const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

	let salary = $state($userProfile?.salary ?? 40000);

	// Allocation categories, each tagged with a group.
	type Group = 'need' | 'want' | 'save';
	const categories: { key: string; label: string; group: Group }[] = [
		{ key: 'rent', label: 'Rent / housing', group: 'need' },
		{ key: 'food', label: 'Food & groceries', group: 'need' },
		{ key: 'transport', label: 'Transport', group: 'need' },
		{ key: 'fun', label: 'Fun & lifestyle', group: 'want' },
		{ key: 'emergencyFund', label: 'Emergency fund', group: 'save' },
		{ key: 'insurance', label: 'Insurance premiums', group: 'save' },
		{ key: 'investments', label: 'Investments (SIP)', group: 'save' }
	];

	let alloc = $state<Record<string, number>>({
		rent: 13000,
		food: 6000,
		transport: 3000,
		fun: 4000,
		emergencyFund: 4000,
		insurance: 2000,
		investments: 8000
	});

	const total = $derived(categories.reduce((sum, c) => sum + (Number(alloc[c.key]) || 0), 0));
	const remaining = $derived(salary - total);

	function groupTotal(group: Group): number {
		return categories
			.filter((c) => c.group === group)
			.reduce((sum, c) => sum + (Number(alloc[c.key]) || 0), 0);
	}
	const needs = $derived(groupTotal('need'));
	const wants = $derived(groupTotal('want'));
	const savings = $derived(groupTotal('save'));

	const pct = (v: number) => (salary > 0 ? Math.round((v / salary) * 100) : 0);

	const tips = $derived.by(() => {
		const out: { tone: 'good' | 'warn'; text: string }[] = [];
		if (remaining !== 0) {
			out.push({
				tone: 'warn',
				text:
					remaining > 0
						? `You still have ${inr(remaining)} unallocated — give every rupee a job.`
						: `You're over budget by ${inr(-remaining)} — trim something.`
			});
		}
		const savingsRate = pct(savings);
		if (savingsRate >= 20) out.push({ tone: 'good', text: `Saving ${savingsRate}% — a strong habit early on.` });
		else out.push({ tone: 'warn', text: `Saving only ${savingsRate}% — aim for ~20% if you can.` });

		if (pct(needs) > 60) out.push({ tone: 'warn', text: `Needs are ${pct(needs)}% of income — high; housing is usually the culprit.` });
		if (pct(wants) > 25) out.push({ tone: 'warn', text: `Lifestyle spend is ${pct(wants)}% — watch lifestyle inflation.` });
		if (alloc.emergencyFund <= 0) out.push({ tone: 'warn', text: 'Nothing going to an emergency fund yet — your first safety net.' });
		if (alloc.insurance <= 0) out.push({ tone: 'warn', text: 'No insurance premium budgeted — protection comes before growth.' });
		return out;
	});
</script>

<h1>First-salary budget</h1>
<p class="sub">Give every rupee of your take-home pay a job. Balance to ₹0 left over.</p>

<div class="layout">
	<section class="alloc">
		<label class="salary">
			Monthly take-home (₹)
			<input type="number" min="0" step="any" bind:value={salary} />
		</label>

		{#each categories as c (c.key)}
			<label class="cat">
				<span class="cat-label">{c.label} <em class="tag {c.group}">{c.group}</em></span>
				<input type="number" min="0" step="any" bind:value={alloc[c.key]} />
			</label>
		{/each}

		<div class="totals" class:over={remaining < 0} class:balanced={remaining === 0}>
			<span>Allocated {inr(total)}</span>
			<strong>{remaining === 0 ? 'Balanced 🎯' : remaining > 0 ? inr(remaining) + ' left' : inr(-remaining) + ' over'}</strong>
		</div>
	</section>

	<section class="feedback">
		<h2>How your money splits</h2>
		<div class="bar">
			<div class="seg need" style="width:{pct(needs)}%" title="Needs"></div>
			<div class="seg want" style="width:{pct(wants)}%" title="Wants"></div>
			<div class="seg save" style="width:{pct(savings)}%" title="Savings"></div>
		</div>
		<div class="legend">
			<span><i class="need"></i> Needs {pct(needs)}%</span>
			<span><i class="want"></i> Wants {pct(wants)}%</span>
			<span><i class="save"></i> Savings {pct(savings)}%</span>
		</div>

		<h2>Coach</h2>
		<ul class="tips">
			{#each tips as tip (tip.text)}
				<li class={tip.tone}>{tip.text}</li>
			{/each}
		</ul>
		<p class="disclaimer">🎓 A learning exercise — not financial advice.</p>
	</section>
</div>

<style>
	.sub {
		color: #52606d;
		margin-top: 0;
	}
	.layout {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}
	@media (max-width: 720px) {
		.layout {
			grid-template-columns: 1fr;
		}
	}
	.alloc,
	.feedback {
		background: #fff;
		border: 1px solid #e4e7eb;
		border-radius: 0.75rem;
		padding: 1rem;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: #3e4c59;
		margin-bottom: 0.6rem;
	}
	.cat {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}
	.cat input {
		width: 120px;
	}
	.cat-label {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.salary input,
	.cat input {
		padding: 0.4rem;
		border: 1px solid #cbd2d9;
		border-radius: 0.4rem;
		font-size: 0.95rem;
	}
	.tag {
		font-style: normal;
		font-size: 0.62rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		padding: 0.05rem 0.35rem;
		border-radius: 999px;
	}
	.tag.need {
		background: #e7eefc;
		color: #2f5fbf;
	}
	.tag.want {
		background: #fdeede;
		color: #b5701c;
	}
	.tag.save {
		background: #e3f2e9;
		color: #1f7a45;
	}
	.totals {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 0.5rem;
		padding: 0.6rem 0.8rem;
		border-radius: 0.5rem;
		background: #fff7e6;
		border: 1px solid #f0d089;
		color: #7a5a12;
		font-size: 0.9rem;
	}
	.totals.balanced {
		background: #e3f2e9;
		border-color: #b6e0c6;
		color: #1f7a45;
	}
	.totals.over {
		background: #fceaec;
		border-color: #e6b3bb;
		color: #a3303f;
	}
	.feedback h2 {
		font-size: 1.05rem;
		margin: 0 0 0.5rem;
	}
	.bar {
		display: flex;
		height: 1.4rem;
		border-radius: 999px;
		overflow: hidden;
		background: #eef0f2;
	}
	.seg.need {
		background: #2f5fbf;
	}
	.seg.want {
		background: #e0a92e;
	}
	.seg.save {
		background: #2e9e5b;
	}
	.legend {
		display: flex;
		gap: 1rem;
		margin: 0.5rem 0 1rem;
		font-size: 0.8rem;
		color: #52606d;
	}
	.legend i {
		display: inline-block;
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 2px;
		margin-right: 0.2rem;
	}
	.legend i.need {
		background: #2f5fbf;
	}
	.legend i.want {
		background: #e0a92e;
	}
	.legend i.save {
		background: #2e9e5b;
	}
	.tips {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.tips li {
		padding: 0.5rem 0.7rem;
		border-radius: 0.5rem;
		font-size: 0.88rem;
	}
	.tips li.good {
		background: #e3f2e9;
		color: #1f7a45;
	}
	.tips li.warn {
		background: #fff7e6;
		color: #7a5a12;
	}
	.disclaimer {
		margin-top: 1rem;
		font-size: 0.78rem;
		color: #7a5a12;
	}
</style>
