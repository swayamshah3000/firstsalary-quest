<script lang="ts">
	import { goto } from '$app/navigation';
	import { startNewGame } from '$lib/stores/gameStore';
	import { userProfileSchema } from '$lib/schemas';

	let name = $state('');
	let city = $state('Bengaluru');
	let salary = $state(40000);
	let familyDependency = $state<'none' | 'partial' | 'high'>('none');
	let jobType = $state<'salaried' | 'freelance' | 'govt' | 'intern'>('salaried');
	let error = $state('');
	let saving = $state(false);

	const cities = ['Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata'];

	async function start() {
		const parsed = userProfileSchema.safeParse({
			name,
			city,
			salary: Number(salary),
			familyDependency,
			jobType
		});
		if (!parsed.success) {
			error = parsed.error.issues[0]?.message ?? 'Please check your details.';
			return;
		}
		error = '';
		saving = true;
		await startNewGame(parsed.data);
		goto('/game');
	}
</script>

<h1>Create your character</h1>
<p class="sub">Set up the first-earner you'll play as for the next 12 months.</p>

<form class="form" onsubmit={(e) => (e.preventDefault(), start())}>
	<label>
		Name
		<input bind:value={name} placeholder="e.g. Aarav" />
	</label>

	<label>
		City
		<select bind:value={city}>
			{#each cities as c (c)}
				<option value={c}>{c}</option>
			{/each}
		</select>
	</label>

	<label>
		Monthly take-home salary (₹)
		<input type="number" min="0" step="any" inputmode="numeric" bind:value={salary} />
	</label>

	<label>
		Family dependency
		<select bind:value={familyDependency}>
			<option value="none">None — only myself</option>
			<option value="partial">Partial — I help out</option>
			<option value="high">High — I'm a main provider</option>
		</select>
	</label>

	<label>
		Job type
		<select bind:value={jobType}>
			<option value="salaried">Salaried</option>
			<option value="freelance">Freelance</option>
			<option value="govt">Government</option>
			<option value="intern">Intern</option>
		</select>
	</label>

	{#if error}<p class="error">{error}</p>{/if}

	<button type="submit" disabled={saving}>
		{saving ? 'Starting…' : 'Start the 12-month journey →'}
	</button>
</form>

<style>
	.sub {
		color: #52606d;
		margin-top: 0;
	}
	.form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 28rem;
		background: #fff;
		padding: 1.25rem;
		border: 1px solid #e4e7eb;
		border-radius: 0.75rem;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-weight: 600;
		font-size: 0.9rem;
	}
	input,
	select {
		padding: 0.5rem;
		border: 1px solid #cbd2d9;
		border-radius: 0.4rem;
		font-size: 1rem;
	}
	.error {
		color: #d1495b;
		margin: 0;
		font-size: 0.9rem;
	}
	button {
		padding: 0.7rem 1rem;
		background: #2e9e5b;
		color: #fff;
		border: none;
		border-radius: 0.5rem;
		font-weight: 700;
		cursor: pointer;
	}
</style>
