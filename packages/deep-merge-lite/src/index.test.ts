import { describe, test, expect } from 'vitest';
import { merge, cloneDeep } from './index';

describe('merge', () => {
    test('basic deep merge', () => {
        const result = merge({}, { a: 1 }, { b: 2 });
        expect(result).toEqual({ a: 1, b: 2 });
    });

    test('nested objects', () => {
        const target = { user: { name: 'John' } };
        const source = { user: { age: 30 } };
        const result = merge({}, target, source);
        expect(result).toEqual({ user: { name: 'John', age: 30 } });
    });

    test('array replace (default)', () => {
        const result = merge({}, { arr: [1, 2] }, { arr: [3, 4] });
        expect(result).toEqual({ arr: [3, 4] });
    });

    test('array concat', () => {
        const result = merge({}, { arr: [1, 2] }, { arr: [3, 4] }, { arrayMerge: 'concat' });
        expect(result).toEqual({ arr: [1, 2, 3, 4] });
    });

    test('array union', () => {
        const result = merge({}, { arr: [1, 2, 3] }, { arr: [2, 3, 4] }, { arrayMerge: 'union' });
        expect(result).toEqual({ arr: [1, 2, 3, 4] });
    });

    test('custom merge function', () => {
        const result = merge(
            { created: '2024-01-01', updated: '2024-01-01' },
            { created: '2024-12-01', updated: '2024-12-01' },
            {
                customMerge: (key) => {
                    if (key === 'created') return (a) => a; // Keep original
                    return undefined;
                }
            }
        );
        expect(result).toEqual({ created: '2024-01-01', updated: '2024-12-01' });
    });

    test('prototype pollution prevention', () => {
        const result = merge({}, JSON.parse('{"__proto__": {"polluted": true}}'));
        expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });

    test('does not mutate original', () => {
        const original = { a: { b: 1 } };
        const result = merge({}, original, { a: { c: 2 } });
        expect(original).toEqual({ a: { b: 1 } });
        expect(result).toEqual({ a: { b: 1, c: 2 } });
    });
});

describe('cloneDeep', () => {
    test('clones primitives', () => {
        expect(cloneDeep(42)).toBe(42);
        expect(cloneDeep('hello')).toBe('hello');
        expect(cloneDeep(null)).toBe(null);
    });

    test('clones objects', () => {
        const original = { a: { b: 1 } };
        const cloned = cloneDeep(original);
        cloned.a.b = 2;
        expect(original.a.b).toBe(1);
    });

    test('clones arrays', () => {
        const original = [1, [2, 3]];
        const cloned = cloneDeep(original);
        (cloned[1] as number[]).push(4);
        expect(original[1]).toEqual([2, 3]);
    });

    test('handles circular references', () => {
        const obj: Record<string, unknown> = { a: 1 };
        obj.self = obj;
        const cloned = cloneDeep(obj);
        expect(cloned.a).toBe(1);
        expect(cloned.self).toBe(cloned);
        expect(cloned.self).not.toBe(obj);
    });

    test('clones Date', () => {
        const date = new Date('2024-01-01');
        const cloned = cloneDeep(date);
        expect(cloned).toEqual(date);
        expect(cloned).not.toBe(date);
    });
});

describe('edge cases', () => {
    test('deep merges Date objects (clones info)', () => {
        const date = new Date('2024-01-01');
        const source = { d: date };
        const target = {};
        const result = merge(target, source) as any;

        expect(result.d).toEqual(date);
        expect(result.d).not.toBe(date); // Should be a clone!
    });

    test('deep merges RegExp objects (clones info)', () => {
        const regex = /test/g;
        const source = { r: regex };
        const target = {};
        const result = merge(target, source) as any;

        expect(result.r).toEqual(regex);
        expect(result.r).not.toBe(regex); // Should be a clone!
    });

    test('ignores symbol keys (current behavior)', () => {
        const sym = Symbol('foo');
        const source = { [sym]: 'bar' };
        const result = merge({}, source);
        const symbols = Object.getOwnPropertySymbols(result);
        expect(symbols.length).toBe(0);
    });

    test('handles circular references in merge', () => {
        const source: any = { a: 1 };
        source.self = source;
        const result = merge({}, source) as any;

        expect(result.a).toBe(1);
        expect(result.self).toBe(result.self.self); // Should effectively be circular or handled
        // Note: cloneDeep handles it, but deepMergeTwo traversal?
        // If deepMergeTwo walks, it might stack overflow if not tracked.
        // We expect it NOT to crash.
    });
});
