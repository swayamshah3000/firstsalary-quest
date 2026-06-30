<script lang="ts">
	// Shown app-wide. FirstSalary Quest is a learning simulator, not advice.
	let { compact = false }: { compact?: boolean } = $props();
</script>

<p class="disclaimer" class:compact>
	🎓 Educational simulator only — this is a game for learning money concepts, not
	financial advice.
</p>

<style>
	.disclaimer {
		margin: 0;
		padding: 0.5rem 0.75rem;
		background: #fff7e6;
		border: 1px solid #f0d089;
		border-radius: 0.5rem;
		color: #7a5a12;
		font-size: 0.85rem;
		text-align: center;
	}
	.compact {
		font-size: 0.75rem;
		padding: 0.35rem 0.5rem;
	}
</style>
