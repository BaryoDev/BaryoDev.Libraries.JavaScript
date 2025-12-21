import { describe, test, expect } from 'vitest';
import { clean } from './index';

describe('clean', () => {
    test('removes null and undefined', () => {
        const input = { a: 1, b: null, c: undefined, d: 'hello' };
        expect(clean(input)).toEqual({ a: 1, d: 'hello' });
    });

    test('removes empty strings by default', () => {
        const input = { a: '', b: 'hi', c: '  ' };
        expect(clean(input)).toEqual({ b: 'hi', c: '  ' });
    });

    test('preserves 0 and false', () => {
        const input = { a: 0, b: false, c: null };
        expect(clean(input)).toEqual({ a: 0, b: false });
    });

    test('cleans nested objects', () => {
        const input = { a: { b: null, c: 1 }, d: { e: undefined } };
        expect(clean(input)).toEqual({ a: { c: 1 } });
    });

    test('cleans arrays', () => {
        const input = { arr: [1, null, '', 2, undefined] };
        expect(clean(input)).toEqual({ arr: [1, 2] });
    });

    test('preserveEmptyArrays option', () => {
        const input = { arr: [null, undefined] };
        expect(clean(input, { preserveEmptyArrays: true })).toEqual({ arr: [] });
    });

    test('preserveEmptyObjects option', () => {
        const input = { obj: { a: null } };
        expect(clean(input, { preserveEmptyObjects: true })).toEqual({ obj: {} });
    });

    test('preserveEmptyStrings option', () => {
        const input = { a: '', b: 'hi' };
        expect(clean(input, { preserveEmptyStrings: true })).toEqual({ a: '', b: 'hi' });
    });

    test('path exclusion', () => {
        const input = { keep: { a: null, b: 1 }, clean: { c: null } };
        expect(clean(input, { exclude: ['keep'] })).toEqual({ keep: { a: null, b: 1 } });
    });

    test('transform while cleaning', () => {
        const input = { a: '  hello  ', b: '  world  ' };
        expect(clean(input, {
            transform: (value) => typeof value === 'string' ? value.trim() : value
        })).toEqual({ a: 'hello', b: 'world' });
    });

    test('custom predicate', () => {
        const input = { a: 1, b: 2, c: 3 };
        expect(clean(input, {
            predicate: (value) => typeof value === 'number' && value > 1
        })).toEqual({ b: 2, c: 3 });
    });

    describe('edge cases', () => {
        test('handles sparse arrays', () => {
            // eslint-disable-next-line no-sparse-arrays
            const input = [1, , 2];
            expect(clean(input)).toEqual([1, 2]);
        });

        test('preserves Date objects', () => {
            const date = new Date();
            const input = { d: date };
            expect(clean(input)).toEqual({ d: date });
        });

        test('preserves RegExp', () => {
            const regex = /test/;
            const input = { r: regex };
            expect(clean(input)).toEqual({ r: regex });
        });

        test('handles Object.create(null)', () => {
            const input = Object.create(null);
            input.a = 1;
            input.b = null;
            expect(clean(input)).toEqual({ a: 1 });
        });
    });
});
