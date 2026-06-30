<script lang="ts">
	import type { QuizQuestion } from '$lib/schemas/lesson';
	import { recordQuizAnswer } from '$lib/stores/gameStore';

	let { questions }: { questions: QuizQuestion[] } = $props();

	// Local selection per question (questionId -> chosen option index).
	let answers = $state<Record<string, number>>({});

	function choose(q: QuizQuestion, idx: number) {
		if (answers[q.questionId] !== undefined) return; // lock once answered
		answers = { ...answers, [q.questionId]: idx };
		recordQuizAnswer(q.questionId, idx === q.correctIndex);
	}

	const answeredCount = $derived(Object.keys(answers).length);
	const correctCount = $derived(
		questions.filter((q) => answers[q.questionId] === q.correctIndex).length
	);
	const done = $derived(answeredCount === questions.length);
</script>

<div class="quiz">
	<h3>Quick check</h3>
	{#each questions as q, qi (q.questionId)}
		{@const chosen = answers[q.questionId]}
		<div class="question">
			<p class="prompt"><span class="qn">{qi + 1}.</span> {q.prompt}</p>
			<div class="options">
				{#each q.options as opt, oi (oi)}
					<button
						class="opt"
						class:correct={chosen !== undefined && oi === q.correctIndex}
						class:wrong={chosen === oi && oi !== q.correctIndex}
						disabled={chosen !== undefined}
						onclick={() => choose(q, oi)}
					>
						{opt}
						{#if chosen !== undefined && oi === q.correctIndex}<span class="mark">✓</span>{/if}
						{#if chosen === oi && oi !== q.correctIndex}<span class="mark">✗</span>{/if}
					</button>
				{/each}
			</div>
		</div>
	{/each}

	<div class="score" class:done>
		{#if done}
			<strong>Score: {correctCount}/{questions.length}</strong>
			{#if correctCount === questions.length}🎉 Perfect!{/if}
		{:else}
			Answered {answeredCount}/{questions.length}
		{/if}
	</div>
</div>

<style>
	.quiz h3 {
		margin: 0 0 0.75rem;
	}
	.question {
		margin-bottom: 1rem;
	}
	.prompt {
		font-weight: 600;
		margin: 0 0 0.5rem;
	}
	.qn {
		color: #2e9e5b;
	}
	.options {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.opt {
		text-align: left;
		padding: 0.6rem 0.8rem;
		border: 1px solid #cbd2d9;
		background: #fff;
		border-radius: 0.5rem;
		font-size: 0.95rem;
		cursor: pointer;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.opt:hover:not(:disabled) {
		border-color: #2e9e5b;
	}
	.opt:disabled {
		cursor: default;
	}
	.opt.correct {
		border-color: #2e9e5b;
		background: #eaf7ef;
	}
	.opt.wrong {
		border-color: #d1495b;
		background: #fceaec;
	}
	.mark {
		font-weight: 800;
	}
	.opt.correct .mark {
		color: #2e9e5b;
	}
	.opt.wrong .mark {
		color: #d1495b;
	}
	.score {
		margin-top: 0.75rem;
		padding: 0.6rem 0.8rem;
		border-radius: 0.5rem;
		background: #f4f5f7;
		color: #52606d;
		text-align: center;
	}
	.score.done {
		background: #e3f2e9;
		color: #1f7a45;
	}
</style>
