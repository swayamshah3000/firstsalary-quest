import { z } from 'zod';

/**
 * Authoring contract for learning modules in src/content/lessons/*.json.
 * Each lesson is a short read (sections) followed by a quiz.
 */

const sectionSchema = z.object({
	heading: z.string().min(1),
	body: z.string().min(1)
});

export const quizQuestionSchema = z.object({
	questionId: z.string().min(1),
	prompt: z.string().min(1),
	options: z.array(z.string().min(1)).min(2),
	correctIndex: z.number().int().min(0)
});

export const lessonSchema = z
	.object({
		id: z.string().min(1),
		order: z.number().int().min(1),
		title: z.string().min(1),
		concept: z.string().min(1),
		estimatedMinutes: z.number().int().positive(),
		summary: z.string().min(1),
		sections: z.array(sectionSchema).min(1),
		quiz: z.array(quizQuestionSchema).min(1),
		disclaimer: z.string().optional()
	})
	.refine((lesson) => lesson.quiz.every((q) => q.correctIndex < q.options.length), {
		message: 'a quiz question has a correctIndex outside its options'
	});

export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
