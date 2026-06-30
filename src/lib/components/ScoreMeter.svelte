<script lang="ts">
	// A single 0-100 meter bar.
	let {
		label,
		value,
		hint = ''
	}: { label: string; value: number; hint?: string } = $props();

	const clamped = $derived(Math.min(100, Math.max(0, value)));
	const tone = $derived(clamped >= 66 ? 'good' : clamped >= 33 ? 'mid' : 'low');
</script>

<div class="meter">
	<div class="row">
		<span class="label">{label}</span>
		<span class="value">{Math.round(clamped)}</span>
	</div>
	<div class="track">
		<div class="fill {tone}" style="width: {clamped}%"></div>
	</div>
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
