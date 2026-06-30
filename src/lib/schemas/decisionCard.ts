import { z } from 'zod';

/**
 * A decision choice's effects describe REAL financial actions that feed the
 * simulation engine (see src/lib/engine) — not raw meter nudges. Every field is
 * optional; a choice only declares what it changes. This schema is the
 * authoring contract for src/content/decisions/*.json.
 */

const loanSchema = z.object({
	label: z.string().min(1),
	principal: z.number().positive(),
	annualRate: z.number().min(0),
	months: z.number().int().positive()
});

const sipSchema = z.object({
	label: z.string().min(1),
	monthly: z.number().positive(),
	annualReturn: z.number().min(0)
});

const insuranceSchema = z.object({
	health: z.number().min(0).optional(),
	term: z.number().min(0).optional(),
	accident: z.number().min(0).optional(),
	criticalIllness: z.number().min(0).optional()
});

export const decisionEffectsSchema = z.object({
	/** One-time cash change (e.g. -25000 to buy a phone outright). */
	cash: z.number().optional(),
	/** Move this much from cash into the earmarked emergency fund. */
	emergencyFund: z.number().optional(),
	/** Recurring change to essential monthly expenses (rent, premiums, …). */
	baseExpenses: z.number().optional(),
	/** Recurring change to discretionary/lifestyle monthly spend. */
	lifestyleExpenses: z.number().optional(),
	/** Take on a loan — creates an EMI + a liability. */
	addLoan: loanSchema.optional(),
	/** Start a monthly SIP. */
	startSip: sipSchema.optional(),
	/** Buy / top-up insurance cover (sum assured per type). */
	insurance: insuranceSchema.optional(),
	/** Optional nudge to the learning/knowledge dimension. */
	knowledge: z.number().optional()
});

/** A single option the player can pick on a decision card. */
export const choiceSchema = z.object({
	label: z.string().min(1, 'choice.label is required'),
	effects: decisionEffectsSchema,
	lesson: z.string().min(1, 'choice.lesson is required')
});

/** A full decision card as authored in src/content/decisions/*.json. */
export const decisionCardSchema = z.object({
	id: z.string().min(1, 'card.id is required'),
	month: z.number().int().min(1).max(12),
	title: z.string().min(1),
	scenario: z.string().min(1),
	choices: z.array(choiceSchema).min(2, 'a card needs at least two choices'),
	concept: z.string().min(1)
});

/** A list of decision cards (e.g. everything loaded for a play-through). */
export const decisionCardsSchema = z.array(decisionCardSchema);

export type DecisionEffects = z.infer<typeof decisionEffectsSchema>;
export type Choice = z.infer<typeof choiceSchema>;
export type DecisionCard = z.infer<typeof decisionCardSchema>;

/**
 * Validate one decision card, throwing a readable error if it is malformed.
 * Use this when loading authored JSON so bad content fails loudly at dev time.
 */
export function parseDecisionCard(input: unknown): DecisionCard {
	return decisionCardSchema.parse(input);
}

/** Non-throwing variant — returns Zod's SafeParse result. */
export function safeParseDecisionCard(input: unknown) {
	return decisionCardSchema.safeParse(input);
}
