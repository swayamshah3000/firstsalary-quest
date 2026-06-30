<script lang="ts">
	import { lessons } from '$lib/lessons';
	import { quizResults } from '$lib/stores/gameStore';
	import type { Lesson } from '$lib/schemas/lesson';
	import Quiz from '$lib/components/Quiz.svelte';

	let selectedId = $state<string | null>(null);
	const selected = $derived(lessons.find((l) => l.id === selectedId) ?? null);

	function status(lesson: Lesson, results: Record<string, boolean>) {
		const total = lesson.quiz.length;
		const answered = lesson.quiz.filter((q) => q.questionId in results).length;
		const correct = lesson.quiz.filter((q) => results[q.questionId] === true).length;
		return { total, answered, correct, complete: answered === total };
	}

	const completedCount = $derived(
		lessons.filter((l) => status(l, $quizResults).complete).length
	);

	function open(id: string) {
		selectedId = id;
		if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
	}
</script>

{#if selected}
	{@const st = status(selected, $quizResults)}
	<button class="back" onclick={() => (selectedId = null)}>← All modules</button>

	<article class="lesson">
		<span class="concept">{selected.concept}</span>
		<h1>{selected.title}</h1>
		<p class="meta">~{selected.estimatedMinutes} min read · Module {selected.order} of {lessons.length}</p>
		<p class="summary">{selected.summary}</p>

		{#each selected.sections as section (section.heading)}
			<section class="block">
				<h2>{section.heading}</h2>
				<p>{section.body}</p>
			</section>
		{/each}

		<hr />
		<Quiz questions={selected.quiz} />

		{#if selected.disclaimer}
			<p class="disclaimer">{selected.disclaimer}</p>
		{/if}
	</article>
{:else}
	<header class="hub-head">
		<h1>Learning modules</h1>
		<p class="sub">
			Short reads with a quick quiz. You've completed
			<strong>{completedCount}/{lessons.length}</strong>.
		</p>
	</header>

	<div class="grid">
		{#each lessons as lesson (lesson.id)}
			{@const st = status(lesson, $quizResults)}
			<button class="card" onclick={() => open(lesson.id)}>
				<div class="top">
					<span class="num">Module {lesson.order}</span>
					{#if st.complete}
						<span class="pill done">✓ {st.correct}/{st.total}</span>
					{:else if st.answered > 0}
						<span class="pill">In progress</span>
					{:else}
						<span class="pill muted">{lesson.estimatedMinutes} min</span>
					{/if}
				</div>
				<h3>{lesson.title}</h3>
				<p class="concept-line">{lesson.concept}</p>
			</button>
		{/each}
	</div>

	<p class="foot-disclaimer">
		🎓 Educational content only — concepts and trade-offs, not financial advice.
	</p>
{/if}

<style>
	.hub-head h1 {
		margin: 0;
	}
	.sub {
		color: #52606d;
		margin: 0.25rem 0 1rem;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 0.9rem;
	}
	.card {
		text-align: left;
		background: #fff;
		border: 1px solid #e4e7eb;
		border-radius: 0.75rem;
		padding: 1rem;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.card:hover {
		border-color: #2e9e5b;
		box-shadow: 0 2px 8px rgba(46, 158, 91, 0.1);
	}
	.top {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.num {
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #52606d;
	}
	.pill {
		font-size: 0.72rem;
		font-weight: 600;
		padding: 0.1rem 0.5rem;
		border-radius: 999px;
		background: #eef6ff;
		color: #1c4a73;
	}
	.pill.done {
		background: #e3f2e9;
		color: #1f7a45;
	}
	.pill.muted {
		background: #f4f5f7;
		color: #52606d;
		font-weight: 500;
	}
	.card h3 {
		margin: 0;
		font-size: 1.05rem;
	}
	.concept-line {
		margin: 0;
		font-size: 0.85rem;
		color: #52606d;
	}
	.foot-disclaimer {
		margin-top: 1.5rem;
		font-size: 0.8rem;
		color: #7a5a12;
		text-align: center;
	}
	.back {
		background: none;
		border: none;
		color: #2e9e5b;
		font-weight: 600;
		cursor: pointer;
		padding: 0;
		margin-bottom: 0.75rem;
	}
	.lesson {
		background: #fff;
		border: 1px solid #e4e7eb;
		border-radius: 0.75rem;
		padding: 1.5rem;
	}
	.concept {
		display: inline-block;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #2e9e5b;
		background: #e3f2e9;
		padding: 0.15rem 0.5rem;
		border-radius: 999px;
	}
	.lesson h1 {
		margin: 0.5rem 0 0.25rem;
		font-size: 1.5rem;
	}
	.meta {
		color: #52606d;
		font-size: 0.85rem;
		margin: 0 0 0.75rem;
	}
	.summary {
		font-weight: 500;
		color: #3e4c59;
		line-height: 1.5;
	}
	.block h2 {
		font-size: 1.05rem;
		margin: 1rem 0 0.25rem;
	}
	.block p {
		margin: 0;
		color: #3e4c59;
		line-height: 1.55;
	}
	hr {
		border: none;
		border-top: 1px solid #e4e7eb;
		margin: 1.5rem 0;
	}
	.disclaimer {
		margin-top: 1rem;
		font-size: 0.8rem;
		color: #7a5a12;
		background: #fff7e6;
		border: 1px solid #f0d089;
		border-radius: 0.5rem;
		padding: 0.6rem 0.8rem;
	}
</style>
