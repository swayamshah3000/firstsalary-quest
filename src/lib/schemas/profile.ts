import { z } from 'zod';

/** How much the player financially supports family — affects difficulty. */
export const familyDependencySchema = z.enum(['none', 'partial', 'high']);

/** The kind of first job the player is simulating. */
export const jobTypeSchema = z.enum(['salaried', 'freelance', 'govt', 'intern']);

/** The simulated character the player sets up on /setup. */
export const userProfileSchema = z.object({
	name: z.string().min(1, 'Please enter a name'),
	city: z.string().min(1, 'Please choose a city'),
	salary: z.number().int().positive('Monthly salary must be positive'),
	familyDependency: familyDependencySchema,
	jobType: jobTypeSchema
});

/** The five meters as a plain object (mirrors the decision-card effect keys). */
export const scoresSchema = z.object({
	netWorth: z.number(),
	emergencyFund: z.number(),
	protectionScore: z.number(),
	lifestyleInflation: z.number(),
	financialFreedom: z.number()
});

export type FamilyDependency = z.infer<typeof familyDependencySchema>;
export type JobType = z.infer<typeof jobTypeSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type Scores = z.infer<typeof scoresSchema>;
