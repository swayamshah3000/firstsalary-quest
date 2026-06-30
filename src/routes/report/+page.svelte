<script lang="ts">
	import { goto } from '$app/navigation';
	import { Chart, Svg, Axis, Area } from 'layerchart';
	import {
		userProfile,
		gameState,
		meters,
		moneySummary,
		resilience,
		resilienceVerdict,
		isGameOver,
		decisionHistory,
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
	function shortInr(v: number): string {
		const a = Math.abs(v);
		const sign = v < 0 ? '-' : '';
		if (a >= 100000) return sign + '₹' + (a / 100000).toFixed(1) + 'L';
		if (a >= 1000) return sign + '₹' + Math.round(a / 1000) + 'k';
		return sign + '₹' + a;
	}

	// Net-worth-over-time series from the engine's recorded history.
	const history = $derived($gameState?.history ?? []);

	let copied = $state(false);
	const shareText = $derived(
		`I survived my first salary year in FirstSalary Quest with a Financial Resilience Score of ${$resilience}/100 (${$resilienceVerdict}) and ${$earnedBadgeCount} badges! 🎓 An educational money simulation — not financial advice.`
	);

	async function copyShare() {
		try {
			await navigator.clipboard.writeText(shareText);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			copied = false;
		}
	}
</script>

{#if !$userProfile || !$gameState}
	<div class="empty">
		<p>No game to report on yet.</p>
		<button onclick={() => goto('/setup')}>Create a character →</button>
	</div>
{:else}
	<header class="report-head">
		<h1>{$userProfile.name}'s First Salary Year</h1>
		<p class="sub">
			{$userProfile.city} · {inr($userProfile.salary)}/mo ·
			{#if $isGameOver}all {TOTAL_MONTHS} months complete{:else}month {$gameState.month} of {TOTAL_MONTHS} so far{/if}
		</p>
	</header>

	<!-- Shareable result card -->
	<section class="share-card">
		<div class="score-block">
			<span class="score">{$resilience}</span>
			<span class="outof">/100</span>
		</div>
		<div class="verdict">
			<span class="band">{$resilienceVerdict}</span>
			<span class="label">Financial Resilience Score</span>
		</div>
		<div class="net">
			<span class="label">Net worth</span>
			<strong>{inr($moneySummary.netWorth)}</strong>
		</div>
	</section>

	<div class="share-actions">
		<button class="primary" onclick={copyShare}>
			{copied ? '✓ Copied!' : 'Copy share text'}
		</button>
		<button onclick={() => goto('/setup')}>Play again</button>
	</div>

	<!-- Net worth over time -->
	<section class="panel">
		<h2>Net worth over the year</h2>
		{#if history.length > 1}
			<div class="chart">
				<Chart
					data={history}
					x="month"
					y="netWorth"
					yNice
					yBaseline={0}
					padding={{ left: 56, bottom: 28, top: 12, right: 12 }}
				>
					<Svg>
						<Axis placement="left" grid rule format={(v: number) => shortInr(v)} />
						<Axis placement="bottom" rule format={(v: number) => 'M' + v} />
						<Area fill="#2e9e5b" fillOpacity={0.15} line={{ stroke: '#2e9e5b', strokeWidth: 2 }} />
					</Svg>
				</Chart>
			</div>
		{:else}
			<p class="muted">Play a few months to see your net-worth trend.</p>
		{/if}
	</section>

	<!-- Money + meters -->
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

	<!-- Achievements -->
	<section class="panel">
		<h2>Badges <span class="count">{$earnedBadgeCount}/{$badges.length} earned</span></h2>
		<Badges badges={$badges} />
	</section>

	<!-- What shaped the year -->
	<section class="panel">
		<h2>Your decisions</h2>
		<ul class="history">
			{#each $decisionHistory as d (d.cardId + d.month)}
				<li><span class="m">M{d.month}</span><span>{d.label}</span></li>
			{/each}
		</ul>
	</section>

	<p class="disclaimer">
		🎓 FirstSalary Quest is an educational simulation, not financial advice. For decisions
		about real money, consult a SEBI-registered investment adviser.
	</p>
{/if}

<style>
	.report-head {
		text-align: center;
		margin-bottom: 1rem;
	}
	.report-head h1 {
		margin: 0;
		font-size: 1.6rem;
	}
	.sub {
		color: #52606d;
		margin: 0.25rem 0 0;
	}
	.share-card {
		display: flex;
		align-items: center;
		justify-content: space-around;
		gap: 1rem;
		flex-wrap: wrap;
		background: linear-gradient(135deg, #1f7a45, #2e9e5b);
		color: #fff;
		border-radius: 1rem;
		padding: 1.5rem;
		text-align: center;
	}
	.score-block {
		display: flex;
		align-items: baseline;
	}
	.score {
		font-size: 3.5rem;
		font-weight: 800;
		line-height: 1;
	}
	.outof {
		font-size: 1.1rem;
		opacity: 0.85;
	}
	.verdict {
		display: flex;
		flex-direction: column;
	}
	.verdict .band {
		font-size: 1.4rem;
		font-weight: 700;
	}
	.verdict .label,
	.net .label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		opacity: 0.85;
	}
	.net {
		display: flex;
		flex-direction: column;
	}
	.net strong {
		font-size: 1.5rem;
	}
	.share-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
		margin: 1rem 0 1.5rem;
	}
	.share-actions button {
		padding: 0.6rem 1.1rem;
		border-radius: 0.5rem;
		border: 1px solid #cbd2d9;
		background: #fff;
		font-weight: 600;
		cursor: pointer;
	}
	.share-actions .primary {
		background: #2e9e5b;
		border-color: #2e9e5b;
		color: #fff;
	}
	.panel {
		background: #fff;
		border: 1px solid #e4e7eb;
		border-radius: 0.75rem;
		padding: 1rem 1.25rem;
		margin-bottom: 1rem;
	}
	.panel h2 {
		margin: 0 0 0.75rem;
		font-size: 1.1rem;
	}
	.panel h2 .count {
		font-size: 0.8rem;
		font-weight: 600;
		color: #2e9e5b;
		margin-left: 0.5rem;
	}
	.chart {
		height: 260px;
		width: 100%;
	}
	.money {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 0.75rem;
		margin-bottom: 1rem;
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
		margin-bottom: 1rem;
	}
	.history {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.history li {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		padding: 0.4rem 0;
		border-bottom: 1px solid #f0f2f4;
	}
	.history .m {
		font-weight: 700;
		color: #2e9e5b;
		min-width: 2rem;
	}
	.disclaimer {
		font-size: 0.8rem;
		color: #7a5a12;
		background: #fff7e6;
		border: 1px solid #f0d089;
		border-radius: 0.5rem;
		padding: 0.6rem 0.8rem;
		text-align: center;
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
	.empty button {
		padding: 0.6rem 1rem;
		background: #2e9e5b;
		color: #fff;
		border: none;
		border-radius: 0.5rem;
		font-weight: 700;
		cursor: pointer;
	}
</style>
