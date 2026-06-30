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
