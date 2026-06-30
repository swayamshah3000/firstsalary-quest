<script lang="ts">
	import DisclaimerBanner from '$lib/components/DisclaimerBanner.svelte';
	import { hasProfile } from '$lib/stores/gameStore';
</script>

<section class="hero">
	<h1>Survive your first 12 months of salary.</h1>
	<p class="tagline">
		FirstSalary Quest is a gamified simulation that teaches first-time earners how to
		handle rent, savings, insurance, SIPs and debt — one month at a time.
	</p>

	<DisclaimerBanner />

	<div class="cta">
		{#if $hasProfile}
			<a class="btn primary" href="/game">Continue your run →</a>
		{:else}
			<a class="btn primary" href="/setup">Create your character →</a>
		{/if}
		<a class="btn" href="/calculators">Try the calculators</a>
	</div>
</section>

<section class="features">
	<div class="card">
		<h3>🎮 Play 12 months</h3>
		<p>Face a real-world money decision each month and watch five meters react.</p>
	</div>
	<div class="card">
		<h3>📊 Track your meters</h3>
		<p>Net worth, emergency fund, protection, lifestyle inflation and financial freedom.</p>
	</div>
	<div class="card">
		<h3>🧮 Learn the math</h3>
		<p>Emergency-fund, SIP and EMI calculators show the numbers behind each choice.</p>
	</div>
</section>

<style>
	.hero {
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;
	}
	h1 {
		font-size: 2rem;
		margin: 0;
	}
	.tagline {
		max-width: 38rem;
		color: #52606d;
		margin: 0;
	}
	.cta {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		justify-content: center;
	}
	.btn {
		text-decoration: none;
		padding: 0.6rem 1rem;
		border-radius: 0.5rem;
		border: 1px solid #cbd2d9;
		color: #1f2933;
		background: #fff;
		font-weight: 600;
	}
	.btn.primary {
		background: #2e9e5b;
		border-color: #2e9e5b;
		color: #fff;
	}
	.features {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1rem;
		margin-top: 2rem;
	}
	.card {
		background: #fff;
		border: 1px solid #e4e7eb;
		border-radius: 0.75rem;
		padding: 1rem;
	}
	.card h3 {
		margin: 0 0 0.5rem;
	}
	.card p {
		margin: 0;
		color: #52606d;
		font-size: 0.95rem;
	}
</style>
