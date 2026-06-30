<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		userProfile,
		currentMonth,
		meters,
		moneySummary,
		applyChoice,
		skipMonth,
		isGameOver,
		TOTAL_MONTHS,
		scoreKeys
	} from '$lib/stores/gameStore';
	import { pickCardForMonth } from '$lib/decisions';
	import ScoreMeter from '$lib/components/ScoreMeter.svelte';

	const meterLabels: Record<(typeof scoreKeys)[number], string> = {
		netWorth: 'Net Worth',
		emergencyFund: 'Emergency Fund',
		protectionScore: 'Protection',
		lifestyleInflation: 'Lifestyle Inflation',
		financialFreedom: 'Financial Freedom'
	};

	const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

	// A stable seed per character → different runs see different scenarios,
	// but a single run stays consistent across reloads.
	const seed = $derived(
		$userProfile ? `${$userProfile.name}|${$userProfile.city}|${$userProfile.salary}` : ''
	);
	const card = $derived(pickCardForMonth($currentMonth, seed));
	let lastLesson = $state('');

	function choose(index: number) {
		if (!card) return;
		lastLesson = card.choices[index]?.lesson ?? '';
		applyChoice(card, index);
	}
</script>

{#if !$userProfile}
	<div class="notice">
		<p>You need a character first.</p>
		<button onclick={() => goto('/setup')}>Go to setup →</button>
	</div>
{:else if $isGameOver}
	<div class="notice">
		<h1>🎉 You finished all {TOTAL_MONTHS} months!</h1>
		<p>See how {$userProfile.name} did, or start again.</p>
		<div class="actions">
			<button onclick={() => goto('/report')}>See your report →</button>
			<button class="ghost" onclick={() => goto('/setup')}>Play again</button>
		</div>
	</div>
{:else}
	<div class="game">
		<div class="head">
			<span class="month">Month {$currentMonth} / {TOTAL_MONTHS}</span>
			<span class="who">{$userProfile.name} · {$userProfile.city}</span>
		</div>

		<div class="money">
			<div><span>Cash</span><strong>{inr($moneySummary.cash)}</strong></div>
			<div><span>Invested</span><strong>{inr($moneySummary.investments)}</strong></div>
			<div><span>Net Worth</span><strong>{inr($moneySummary.netWorth)}</strong></div>
		</div>

		{#if card}
			<article class="card">
				<span class="concept">{card.concept}</span>
				<h1>{card.title}</h1>
				<p class="scenario">{card.scenario}</p>

				<div class="choices">
					{#each card.choices as choice, i (choice.label)}
						<button onclick={() => choose(i)}>{choice.label}</button>
					{/each}
				</div>
			</article>
		{:else}
			<article class="card">
				<h1>A quiet month</h1>
				<p class="scenario">No decision this month — your money keeps ticking along.</p>
				<div class="choices">
					<button onclick={() => skipMonth()}>Continue to next month →</button>
				</div>
			</article>
		{/if}

		{#if lastLesson}
			<div class="lesson">💡 {lastLesson}</div>
		{/if}

		<section class="meters">
			{#each scoreKeys as key (key)}
				<ScoreMeter label={meterLabels[key]} value={$meters[key]} />
			{/each}
		</section>
	</div>
{/if}

<style>
	.notice {
		text-align: center;
		background: #fff;
		border: 1px solid #e4e7eb;
		border-radius: 0.75rem;
		padding: 2rem;
	}
	.actions {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
	}
	.head {
		display: flex;
		justify-content: space-between;
		color: #52606d;
		font-size: 0.9rem;
		margin-bottom: 0.5rem;
	}
	.month {
		font-weight: 700;
		color: #2e9e5b;
	}
	.money {
		display: flex;
		gap: 1rem;
		background: #fff;
		border: 1px solid #e4e7eb;
		border-radius: 0.75rem;
		padding: 0.75rem 1rem;
		margin-bottom: 0.75rem;
	}
	.money div {
		display: flex;
		flex-direction: column;
	}
	.money span {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: #52606d;
	}
	.money strong {
		font-size: 1.05rem;
	}
	.card {
		background: #fff;
		border: 1px solid #e4e7eb;
		border-radius: 0.75rem;
		padding: 1.5rem;
	}
	.concept {
		display: inline-block;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #2e9e5b;
		background: #e3f2e9;
		padding: 0.15rem 0.5rem;
		border-radius: 999px;
	}
	.card h1 {
		margin: 0.5rem 0;
		font-size: 1.4rem;
	}
	.scenario {
		color: #3e4c59;
		line-height: 1.5;
	}
	.choices {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		margin-top: 1rem;
	}
	.choices button {
		text-align: left;
		padding: 0.8rem 1rem;
		border: 1px solid #cbd2d9;
		background: #f9fafb;
		border-radius: 0.5rem;
		font-size: 1rem;
		cursor: pointer;
	}
	.choices button:hover {
		border-color: #2e9e5b;
		background: #f1faf4;
	}
	.lesson {
		margin-top: 1rem;
		padding: 0.75rem 1rem;
		background: #eef6ff;
		border: 1px solid #cfe3fb;
		border-radius: 0.5rem;
		color: #1c4a73;
	}
	.meters {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 0.75rem 1.5rem;
		margin-top: 1.5rem;
	}
	button {
		cursor: pointer;
	}
	.ghost {
		background: transparent;
		border: 1px solid #cbd2d9;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
	}
</style>
