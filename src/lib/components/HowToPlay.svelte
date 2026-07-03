<script lang="ts">
	import type { UserProfile } from '$lib/schemas';
	import { createInitialState } from '$lib/engine';

	let { profile, onClose }: { profile: UserProfile; onClose: () => void } = $props();

	const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

	// Always show the true STARTING situation (even if re-opened mid-game).
	const start = $derived(createInitialState(profile));
	const salary = $derived(profile.salary);
	const essentials = $derived(start.baseExpenses);
	const lifestyle = $derived(start.lifestyleExpenses);
	const surplus = $derived(salary - essentials - lifestyle);
	const endCash = $derived(start.cash + surplus);

	const meters = [
		{ name: 'Net Worth', desc: 'everything you own minus what you owe' },
		{ name: 'Emergency Readiness', desc: 'months of expenses your savings could cover' },
		{ name: 'Protection', desc: 'how well insurance shields you from shocks' },
		{ name: 'Lifestyle Inflation', desc: 'keeping non-essential "wants" in check' },
		{ name: 'Financial Freedom', desc: 'how much you have invested' }
	];
</script>

<div
	class="backdrop"
	role="button"
	tabindex="0"
	aria-label="Close"
	onclick={onClose}
	onkeydown={(e) => e.key === 'Escape' && onClose()}
></div>

<div class="modal" role="dialog" aria-modal="true" aria-label="How to play">
	<button class="close" aria-label="Close" onclick={onClose}>✕</button>

	<h2>You've got your first salary, {profile.name}! 🎉</h2>
	<p class="sub">Here's how the game works — takes 20 seconds to read.</p>

	<section class="block">
		<h3>Your starting position ({profile.city}, {inr(salary)}/month)</h3>
		<ul class="facts">
			<li><span>💰 Cash to start</span><strong>{inr(start.cash)}</strong></li>
			<li><span>🏙️ Monthly essentials (rent, food, transport)</span><strong>{inr(essentials)}</strong></li>
			<li><span>🛍️ Starting lifestyle spend</span><strong>{inr(lifestyle)}</strong></li>
		</ul>
		<p class="note">
			Your starting cash is just an opening buffer. Your <strong>{inr(salary)} salary arrives
			every month</strong> as you play — it's separate from this.
		</p>
	</section>

	<section class="block">
		<h3>How each month works</h3>
		<div class="flow">
			<div class="flow-row muted">Start of the month<span>{inr(start.cash)}</span></div>
			<div class="flow-row plus">+ Salary arrives<span>+{inr(salary)}</span></div>
			<div class="flow-row minus">− Essentials<span>−{inr(essentials)}</span></div>
			<div class="flow-row minus">− Lifestyle spending<span>−{inr(lifestyle)}</span></div>
			<div class="flow-row total">Left over → saved<span>+{inr(surplus)}</span></div>
			<div class="flow-row muted">End of the month<span>{inr(endCash)}</span></div>
		</div>
		<p class="note">Whatever you don't spend piles up into savings, investments and net worth.</p>
	</section>

	<section class="block">
		<h3>Your 5 meters <span class="hint">(0–100, higher is better — aim for 70+)</span></h3>
		<ul class="meters-list">
			{#each meters as m (m.name)}
				<li><strong>{m.name}</strong> — {m.desc}</li>
			{/each}
		</ul>
	</section>

	<section class="block goal">
		<h3>🎯 Your goal</h3>
		<p>
			Make one smart money decision each month for 12 months. Finish with a high
			<strong>Financial Resilience Score</strong> — a strong first year lands around
			<strong>70–90</strong>.
		</p>
	</section>

	<button class="cta" onclick={onClose}>Let's go →</button>
	<p class="disclaimer">🎓 Educational simulation, not financial advice.</p>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(20, 30, 25, 0.5);
		z-index: 50;
	}
	.modal {
		position: fixed;
		z-index: 51;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: min(560px, calc(100vw - 2rem));
		max-height: calc(100vh - 2rem);
		overflow-y: auto;
		background: #fff;
		border-radius: 1rem;
		padding: 1.5rem;
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
	}
	.close {
		position: absolute;
		top: 0.9rem;
		right: 0.9rem;
		border: none;
		background: #f4f5f7;
		width: 1.9rem;
		height: 1.9rem;
		border-radius: 50%;
		cursor: pointer;
		color: #52606d;
		font-size: 0.9rem;
	}
	h2 {
		margin: 0 1.5rem 0.25rem 0;
		font-size: 1.35rem;
	}
	.sub {
		margin: 0 0 1rem;
		color: #52606d;
		font-size: 0.9rem;
	}
	.block {
		margin-bottom: 1.1rem;
	}
	h3 {
		margin: 0 0 0.5rem;
		font-size: 1rem;
	}
	.hint {
		font-weight: 400;
		font-size: 0.8rem;
		color: #52606d;
	}
	.facts {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.facts li {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		font-size: 0.9rem;
		border-bottom: 1px solid #f0f2f4;
		padding-bottom: 0.35rem;
	}
	.facts strong {
		white-space: nowrap;
	}
	.note {
		margin: 0.6rem 0 0;
		font-size: 0.82rem;
		color: #3e4c59;
		background: #f4f8f5;
		border: 1px solid #dcebe1;
		border-radius: 0.5rem;
		padding: 0.5rem 0.65rem;
		line-height: 1.45;
	}
	.flow {
		border: 1px solid #e4e7eb;
		border-radius: 0.6rem;
		overflow: hidden;
	}
	.flow-row {
		display: flex;
		justify-content: space-between;
		padding: 0.45rem 0.75rem;
		font-size: 0.9rem;
		border-bottom: 1px solid #f0f2f4;
	}
	.flow-row:last-child {
		border-bottom: none;
	}
	.flow-row.muted {
		color: #52606d;
		background: #fafbfc;
	}
	.flow-row.plus span {
		color: #1f7a45;
		font-weight: 600;
	}
	.flow-row.minus span {
		color: #a3303f;
	}
	.flow-row.total {
		font-weight: 700;
		background: #e3f2e9;
		color: #1f7a45;
	}
	.meters-list {
		margin: 0;
		padding-left: 1.1rem;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		font-size: 0.88rem;
		color: #3e4c59;
	}
	.goal p {
		margin: 0;
		font-size: 0.9rem;
		color: #3e4c59;
		line-height: 1.5;
	}
	.cta {
		width: 100%;
		padding: 0.75rem;
		background: #1b6b3a;
		color: #fff;
		border: none;
		border-radius: 0.6rem;
		font-weight: 700;
		font-size: 1rem;
		cursor: pointer;
		margin-top: 0.25rem;
	}
	.cta:hover {
		background: #155730;
	}
	.disclaimer {
		text-align: center;
		font-size: 0.72rem;
		color: #7a5a12;
		margin: 0.6rem 0 0;
	}
</style>
