<script lang="ts">
	import type { EvaluatedBadge } from '$lib/badges';

	let { badges }: { badges: EvaluatedBadge[] } = $props();
</script>

<div class="grid">
	{#each badges as badge (badge.id)}
		<div class="badge" class:earned={badge.earned} title={badge.description}>
			<span class="emoji">{badge.emoji}</span>
			<span class="name">{badge.name}</span>
			<span class="desc">{badge.description}</span>
			{#if !badge.earned}<span class="lock">Locked</span>{/if}
		</div>
	{/each}
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 0.6rem;
	}
	.badge {
		border: 1px solid #e4e7eb;
		border-radius: 0.6rem;
		padding: 0.75rem;
		text-align: center;
		background: #fafbfc;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		opacity: 0.55;
		filter: grayscale(0.8);
		position: relative;
	}
	.badge.earned {
		opacity: 1;
		filter: none;
		background: #fff;
		border-color: #b6e0c6;
		box-shadow: 0 1px 4px rgba(46, 158, 91, 0.12);
	}
	.emoji {
		font-size: 1.8rem;
	}
	.name {
		font-weight: 700;
		font-size: 0.85rem;
	}
	.desc {
		font-size: 0.72rem;
		color: #52606d;
	}
	.lock {
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #9aa5b1;
		margin-top: 0.15rem;
	}
</style>
