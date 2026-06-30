import { describe, it, expect } from 'vitest';
import { decisionCards } from './decisions';
import { lessons } from './lessons';

// Runs the content loaders so any schema violation throws here (with the
// offending file path) rather than 500-ing the app at runtime — the production
// build does NOT execute these loaders because ssr is disabled.
describe('content loads and validates', () => {
	it('all decision cards load and validate', () => {
		expect(decisionCards.length).toBeGreaterThan(0);
	});
	it('all lessons load and validate', () => {
		expect(lessons.length).toBeGreaterThan(0);
	});
});
