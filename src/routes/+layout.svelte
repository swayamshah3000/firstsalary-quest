<script lang="ts">
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import DisclaimerBanner from '$lib/components/DisclaimerBanner.svelte';
	import { hydrate } from '$lib/stores/gameStore';

	let { children } = $props();

	// Restore any saved game (SQLite on desktop, localStorage in the browser).
	onMount(() => {
		void hydrate();
	});

	const nav = [
		{ href: '/', label: 'Home' },
		{ href: '/setup', label: 'Setup' },
		{ href: '/game', label: 'Play' },
		{ href: '/dashboard', label: 'Dashboard' },
		{ href: '/learn', label: 'Learn' },
		{ href: '/budget', label: 'Budget' },
		{ href: '/calculators', label: 'Calculators' }
	];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="shell">
	<header>
		<a class="brand" href="/">FirstSalary <span>Quest</span></a>
		<nav>
			{#each nav as item (item.href)}
				<a href={item.href} class:active={page.url.pathname === item.href}>{item.label}</a>
			{/each}
		</nav>
	</header>

	<main>
		{@render children()}
	</main>

	<footer>
		<DisclaimerBanner compact />
	</footer>
</div>

<style>
	:global(body) {
		margin: 0;
		font-family:
			system-ui,
			-apple-system,
			Segoe UI,
			Roboto,
			sans-serif;
		background: #f4f5f7;
		color: #1f2933;
	}
	.shell {
		max-width: 960px;
		margin: 0 auto;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		box-sizing: border-box;
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding-bottom: 1rem;
	}
	.brand {
		font-size: 1.25rem;
		font-weight: 800;
		text-decoration: none;
		color: #1f2933;
	}
	.brand span {
		color: #2e9e5b;
	}
	nav {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	nav a {
		text-decoration: none;
		color: #52606d;
		font-size: 0.95rem;
		padding: 0.25rem 0.5rem;
		border-radius: 0.4rem;
	}
	nav a.active {
		background: #e3f2e9;
		color: #2e9e5b;
		font-weight: 600;
	}
	main {
		flex: 1;
	}
	footer {
		padding-top: 1rem;
	}
</style>
