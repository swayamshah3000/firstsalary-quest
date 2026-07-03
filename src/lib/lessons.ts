import { lessonSchema, type Lesson } from '$lib/schemas/lesson';

/**
 * Eagerly import + validate every learning module from src/content/lessons.
 * Malformed content throws at module load, surfacing authoring mistakes early.
 */
const modules = import.meta.glob('../content/lessons/*.json', { eager: true });

export const lessons: Lesson[] = Object.entries(modules)
	.map(([path, mod]) => {
		const result = lessonSchema.safeParse((mod as { default: unknown }).default);
		if (!result.success) {
			throw new Error(`Invalid lesson ${path}: ${result.error.message}`);
		}
		return result.data;
	})
	.sort((a, b) => a.order - b.order);

export function lessonById(id: string): Lesson | undefined {
	return lessons.find((lesson) => lesson.id === id);
}

/**
 * Map a decision card's concept/title text to the most relevant lesson, so the
 * game can offer "learn this now" in context. Heuristic keyword match — the first
 * rule whose keyword appears (case-insensitive) wins, so order matters.
 */
const CONCEPT_TO_LESSON: { keywords: string[]; lessonId: string }[] = [
	{ keywords: ['scam', 'loan app', 'fraud', 'predatory'], lessonId: 'avoiding-scams' },
	{ keywords: ['credit score', 'cibil'], lessonId: 'credit-score-basics' },
	{ keywords: ['credit card', 'bnpl', 'emi', 'loan', 'debt', 'borrow'], lessonId: 'debt-emi-traps' },
	{ keywords: ['car'], lessonId: 'cost-of-owning-a-car' },
	{ keywords: ['rent', 'buy', 'housing', 'asset', 'liabilit', 'upskill'], lessonId: 'assets-vs-liabilities' },
	{ keywords: ['insurance', 'cover', 'term', 'health', 'accident', 'protection', 'critical illness'], lessonId: 'protection-insurance' },
	{ keywords: ['sip', 'compound', 'invest', 'index'], lessonId: 'investing-compounding' },
	{ keywords: ['gold', 'fd', 'diversif', 'risk', 'mutual'], lessonId: 'risk-and-diversification' },
	{ keywords: ['emergency'], lessonId: 'emergency-fund' },
	{ keywords: ['tax', '80c'], lessonId: 'tax-basics' },
	{ keywords: ['windfall', 'bonus', 'goal'], lessonId: 'goal-planning' },
	{ keywords: ['salary', 'ctc', 'payslip', 'pf'], lessonId: 'salary-structure' },
	{ keywords: ['retire', 'nps'], lessonId: 'retirement-starting-young' },
	{ keywords: ['lifestyle', 'subscription', 'budget', 'family'], lessonId: 'first-salary-budget' }
];

export function lessonForConcept(text: string): Lesson | undefined {
	const haystack = text.toLowerCase();
	for (const rule of CONCEPT_TO_LESSON) {
		if (rule.keywords.some((kw) => haystack.includes(kw))) {
			return lessonById(rule.lessonId);
		}
	}
	return undefined;
}
