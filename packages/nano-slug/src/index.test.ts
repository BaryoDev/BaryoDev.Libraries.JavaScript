import { describe, test, expect } from 'vitest';
import { slugify } from './index';

describe('slugify', () => {
    test('basic strings', () => {
        expect(slugify('Hello World')).toBe('hello-world');
        expect(slugify('foo bar baz')).toBe('foo-bar-baz');
    });

    test('accented characters', () => {
        expect(slugify('Café')).toBe('cafe');
        expect(slugify('Résumé')).toBe('resume');
        expect(slugify('Ñoño')).toBe('nono');
    });

    test('custom separator', () => {
        expect(slugify('Hello World', { separator: '_' })).toBe('hello_world');
        expect(slugify('foo bar', { separator: '.' })).toBe('foo.bar');
    });

    test('custom replacements', () => {
        expect(slugify('Rock & Roll')).toBe('rock-and-roll');
        expect(slugify('hello@world')).toBe('hello-at-world');
        expect(slugify('100%', { replacements: { '%': 'pct' } })).toBe('100-pct');
    });

    test('max length', () => {
        expect(slugify('This is a very long title', { maxLength: 10 })).toBe('this-is-a');
        expect(slugify('Hello World', { maxLength: 5 })).toBe('hello');
    });

    test('edge cases', () => {
        expect(slugify('')).toBe('');
        expect(slugify('   ')).toBe('');
        expect(slugify('---')).toBe('');
        expect(slugify('Hello---World')).toBe('hello-world');
    });

    describe('more edge cases', () => {
        test('strips emojis', () => {
            expect(slugify('I ❤️ JS')).toBe('i-js');
        });

        test('strips non-latin characters (ASCII only)', () => {
            expect(slugify('你好 World')).toBe('world');
        });

        test('max length trims partial separator', () => {
            // "hello-world" (11 chars). Max 6. "hello-" -> "hello"
            expect(slugify('Hello World', { maxLength: 6 })).toBe('hello');
        });

        test('handles null/undefined gracefully', () => {
            expect(slugify(null as any)).toBe('');
            expect(slugify(undefined as any)).toBe('');
        });
    });
});
