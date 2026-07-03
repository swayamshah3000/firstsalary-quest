<script lang="ts">
	// A single 0-100 meter bar. Pass `info` to show a tap-to-learn ⓘ explaining
	// what the meter means (used on the game/dashboard/report screens so a
	// first-time player understands the five meters).
	let {
		label,
		value,
		hint = '',
		info = ''
	}: { label: string; value: number; hint?: string; info?: string } = $props();

	const clamped = $derived(Math.min(100, Math.max(0, value)));
	const tone = $derived(clamped >= 66 ? 'good' : clamped >= 33 ? 'mid' : 'low');

	let open = $state(false);
</script>

<div class="meter">
	<div class="row">
		<span class="label">
			{label}
			{#if info}
				<button
					type="button"
					class="info-btn"
					class:active={open}
					aria-label={`What is ${label}?`}
					aria-expanded={open}
					onclick={() => (open = !open)}
				>
					i
				</button>
			{/if}
		</span>
		<span class="value">{Math.round(clamped)}</span>
	</div>
	<div class="track">
		<div class="fill {tone}" style="width: {clamped}%"></div>
	</div>
	{#if open && info}<p class="info-text">{info}</p>{/if}
	{#if hint}<p class="hint">{hint}</p>{/if}
</div>

<style>
	.meter {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.row {
		display: flex;
		justify-content: space-between;
		font-size: 0.9rem;
	}
	.label {
		font-weight: 600;
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}
	.info-btn {
		width: 1.05rem;
		height: 1.05rem;
		border-radius: 50%;
		border: 1px solid #b6c2cd;
		background: #fff;
		color: #52606d;
		font-size: 0.7rem;
		font-style: italic;
		font-weight: 700;
		line-height: 1;
		cursor: pointer;
		padding: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
	.info-btn:hover,
	.info-btn.active {
		border-color: #2e9e5b;
		background: #e3f2e9;
		color: #1f7a45;
	}
	.info-text {
		margin: 0.35rem 0 0;
		font-size: 0.78rem;
		line-height: 1.4;
		color: #3e4c59;
		background: #f4f8f5;
		border: 1px solid #dcebe1;
		border-radius: 0.4rem;
		padding: 0.5rem 0.6rem;
	}
	.track {
		height: 0.6rem;
		background: #e6e8ec;
		border-radius: 999px;
		overflow: hidden;
	}
	.fill {
		height: 100%;
		border-radius: 999px;
		transition: width 0.4s ease;
	}
	.fill.good {
		background: #2e9e5b;
	}
	.fill.mid {
		background: #e0a92e;
	}
	.fill.low {
		background: #d1495b;
	}
	.hint {
		margin: 0;
		font-size: 0.75rem;
		color: #6b7280;
	}
</style>
