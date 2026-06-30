<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		userProfile,
		meters,
		moneySummary,
		currentMonth,
		resilience,
		resilienceVerdict,
		decisionHistory,
		isGameOver,
		badges,
		earnedBadgeCount,
		scoreKeys,
		TOTAL_MONTHS
	} from '$lib/stores/gameStore';
	import ScoreMeter from '$lib/components/ScoreMeter.svelte';
	import Badges from '$lib/components/Badges.svelte';

	const meterLabels: Record<(typeof scoreKeys)[number], string> = {
		netWorth: 'Net Worth',
		emergencyFund: 'Emergency Fund',
		protectionScore: 'Protection',
		lifestyleInflation: 'Lifestyle Inflation',
		financialFreedom: 'Financial Freedom'
	};

	const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
</script>

<h1>Dashboard</h1>

{#if !$userProfile}
	<div class="empty">
		<p>No game in progress yet.</p>
		<button onclick={() => goto('/setup')}>Create a character →</button>
	</div>
{:else}
	<div class="summary">
		<div>
			<span class="who">{$userProfile.name}</span>
			<span class="meta">{$userProfile.city} · {inr($userProfile.salary)}/mo</span>
			<span class="meta">Month {Math.min($currentMonth, TOTAL_MONTHS)} of {TOTAL_MONTHS}</span>
		</div>
		<div class="overall">
			<span class="num">{$resilience}</span>
			<span class="lbl">Resilience</span>
			<span class="band">{$resilienceVerdict}</span>
		</div>
	</div>

	{#if $isGameOver}
		<a class="report-cta" href="/report">🎉 Your year is complete — view your full report &amp; share card →</a>
	{/if}

	<section class="money">
		<div><span>Cash</span><strong>{inr($moneySummary.cash)}</strong></div>
		<div><span>Emergency Fund</span><strong>{inr($moneySummary.emergencyFund)}</strong></div>
		<div><span>Invested</span><strong>{inr($moneySummary.investments)}</strong></div>
		<div><span>Net Worth</span><strong>{inr($moneySummary.netWorth)}</strong></div>
	</section>

	<section class="meters">
		{#each scoreKeys as key (key)}
			<ScoreMeter label={meterLabels[key]} value={$meters[key]} />
		{/each}
	</section>

	<h2>Badges <span class="count">{$earnedBadgeCount}/{$badges.length}</span></h2>
	<div class="badges-wrap"><Badges badges={$badges} /></div>

	<h2>Decision history</h2>
	{#if $decisionHistory.length === 0}
		<p class="muted">No decisions made yet. Head to <a href="/game">Play</a>.</p>
	{:else}
		<ul class="history">
			{#each $decisionHistory as d (d.cardId + d.month)}
				<li>
					<span class="m">M{d.month}</span>
					<span>{d.label}</span>
				</li>
			{/each}
		</ul>
	{/if}
{/if}

<style>
	.report-cta {
		display: block;
		margin: 1rem 0;
		padding: 0.75rem 1rem;
		background: #e3f2e9;
		border: 1px solid #b6e0c6;
		border-radius: 0.6rem;
		color: #1f7a45;
		font-weight: 600;
		text-align: center;
		text-decoration: none;
	}
	.summary {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: #fff;
		border: 1px solid #e4e7eb;
		border-radius: 0.75rem;
		padding: 1rem 1.25rem;
	}
	.who {
		display: block;
		font-size: 1.2rem;
		font-weight: 700;
	}
	.meta {
		display: block;
		color: #52606d;
		font-size: 0.85rem;
	}
	.overall {
		text-align: center;
	}
	.overall .num {
		display: block;
		font-size: 2rem;
		font-weight: 800;
		color: #2e9e5b;
		line-height: 1;
	}
	.overall .lbl {
		font-size: 0.7rem;
		text-transform: uppercase;
		color: #52606d;
	}
	.overall .band {
		display: block;
		font-size: 0.8rem;
		font-weight: 600;
		color: #1f2933;
		margin-top: 0.2rem;
	}
	.money {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 0.75rem;
		margin: 1rem 0;
	}
	.money div {
		background: #fff;
		border: 1px solid #e4e7eb;
		border-radius: 0.6rem;
		padding: 0.6rem 0.8rem;
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
	.meters {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 0.75rem 1.5rem;
		margin: 1rem 0 1.5rem;
	}
	.history {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.history li {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		background: #fff;
		border: 1px solid #e4e7eb;
		border-radius: 0.5rem;
		padding: 0.5rem 0.75rem;
	}
	.history .m {
		font-weight: 700;
		color: #2e9e5b;
		min-width: 2rem;
	}
	.count {
		font-size: 0.8rem;
		font-weight: 600;
		color: #2e9e5b;
		margin-left: 0.4rem;
	}
	.badges-wrap {
		margin-bottom: 1.5rem;
	}
	.muted {
		color: #52606d;
	}
	.empty {
		background: #fff;
		border: 1px solid #e4e7eb;
		border-radius: 0.75rem;
		padding: 2rem;
		text-align: center;
	}
	button {
		padding: 0.6rem 1rem;
		background: #2e9e5b;
		color: #fff;
		border: none;
		border-radius: 0.5rem;
		font-weight: 700;
		cursor: pointer;
	}
</style>
