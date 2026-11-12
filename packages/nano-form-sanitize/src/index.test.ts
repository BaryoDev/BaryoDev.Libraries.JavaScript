import { describe, test, expect } from 'vitest';
import { sanitize } from './index';

describe('sanitize', () => {
    test('converts empty strings to null by default', () => {
        const input = { name: 'Jo', dob: '', email: '' };
        expect(sanitize(input)).toEqual({ name: 'Jo', dob: null, email: null });
    });

    test('preserves non-empty strings', () => {
        const input = { a: 'hello', b: 'world' };
        expect(sanitize(input)).toEqual({ a: 'hello', b: 'world' });
    });

    test('preserves null, undefined, numbers, booleans', () => {
        const input = { a: null, b: undefined, c: 0, d: false, e: 42 };
        expect(sanitize(input)).toEqual({ a: null, b: undefined, c: 0, d: false, e: 42 });
    });

    test('preserves Date objects', () => {
        const date = new Date('2026-01-15');
        const input = { d: date };
        expect(sanitize(input)).toEqual({ d: date });
    });

    test('preserves arrays (shallow mode)', () => {
        const input = { tags: ['a', '', 'b'] };
        expect(sanitize(input)).toEqual({ tags: ['a', '', 'b'] });
    });

    describe('emptyToNull option', () => {
        test('disabled: keeps empty strings as-is', () => {
            const input = { a: '', b: 'hi' };
            expect(sanitize(input, { emptyToNull: false })).toEqual({ a: '', b: 'hi' });
        });

        test('enabled explicitly: same as default', () => {
            const input = { a: '', b: 'hi' };
            expect(sanitize(input, { emptyToNull: true })).toEqual({ a: null, b: 'hi' });
        });
    });

    describe('trim option', () => {
        test('trims whitespace from strings', () => {
            const input = { a: '  hello  ', b: '  world  ' };
            expect(sanitize(input, { trim: true })).toEqual({ a: 'hello', b: 'world' });
        });

        test('trim + emptyToNull: whitespace-only becomes null', () => {
            const input = { a: '   ', b: 'hi' };
            expect(sanitize(input, { trim: true, emptyToNull: true })).toEqual({ a: null, b: 'hi' });
        });

        test('trim without emptyToNull: whitespace-only becomes empty string', () => {
            const input = { a: '   ', b: 'hi' };
            expect(sanitize(input, { trim: true, emptyToNull: false })).toEqual({ a: '', b: 'hi' });
        });

        test('trim disabled by default', () => {
            const input = { a: '  hello  ' };
            expect(sanitize(input)).toEqual({ a: '  hello  ' });
        });
    });

    describe('deep option', () => {
        test('recurses into nested objects', () => {
            const input = { addr: { city: 'NYC', zip: '' }, name: '' };
            expect(sanitize(input, { deep: true })).toEqual({
                addr: { city: 'NYC', zip: null },
                name: null,
            });
        });

        test('multiple levels deep', () => {
            const input = { a: { b: { c: '' } } };
            expect(sanitize(input, { deep: true })).toEqual({ a: { b: { c: null } } });
        });

        test('deep + trim', () => {
            const input = { outer: { inner: '  hi  ', empty: '   ' } };
            expect(sanitize(input, { deep: true, trim: true })).toEqual({
                outer: { inner: 'hi', empty: null },
            });
        });

        test('shallow by default: nested objects untouched', () => {
            const input = { nested: { a: '' } };
            expect(sanitize(input)).toEqual({ nested: { a: '' } });
        });

        test('does not recurse into arrays', () => {
            const input = { list: [{ a: '' }] };
            expect(sanitize(input, { deep: true })).toEqual({ list: [{ a: '' }] });
        });

        test('does not recurse into Date objects', () => {
            const date = new Date('2026-01-15');
            const input = { d: date };
            expect(sanitize(input, { deep: true })).toEqual({ d: date });
        });
    });

    describe('edge cases', () => {
        test('empty object returns empty object', () => {
            expect(sanitize({})).toEqual({});
        });

        test('all empty strings become all null', () => {
            const input = { a: '', b: '', c: '' };
            expect(sanitize(input)).toEqual({ a: null, b: null, c: null });
        });

        test('mixed types preserved correctly', () => {
            const input = {
                str: 'hello',
                empty: '',
                num: 123,
                zero: 0,
                bool: true,
                falsy: false,
                nil: null,
                undef: undefined,
            };
            expect(sanitize(input)).toEqual({
                str: 'hello',
                empty: null,
                num: 123,
                zero: 0,
                bool: true,
                falsy: false,
                nil: null,
                undef: undefined,
            });
        });

        test('does not mutate the original object', () => {
            const input = { a: '', b: 'hi' };
            const copy = { ...input };
            sanitize(input);
            expect(input).toEqual(copy);
        });

        test('does not mutate nested objects in deep mode', () => {
            const nested = { x: '' };
            const input = { nested };
            sanitize(input, { deep: true });
            expect(nested.x).toBe('');
        });

        test('all options disabled: passthrough', () => {
            const input = { a: '', b: '  hi  ' };
            expect(sanitize(input, { emptyToNull: false, trim: false, deep: false }))
                .toEqual({ a: '', b: '  hi  ' });
        });
    });

    describe('deep mode with non-plain objects', () => {
        test('leaves File, Blob, Map, Set, URL and Date as they are', () => {
            const blob = new Blob(['x']);
            const map = new Map([['a', 1]]);
            const set = new Set([1]);
            const url = new URL('http://x/');
            const date = new Date(0);
            const file = new File(['x'], 'a.txt');
            const out = sanitize({ blob, map, set, url, date, file }, { deep: true });

            expect(out.blob).toBe(blob);
            expect(out.map).toBe(map);
            expect(out.set).toBe(set);
            expect(out.url).toBe(url);
            expect(out.date).toBe(date);
            expect(out.file).toBe(file);
        });

        test('leaves class instances as they are', () => {
            class Money { constructor(public amount: string) { } }
            const m = new Money('');
            const out = sanitize({ m }, { deep: true });
            expect(out.m).toBe(m);
            expect(out.m.amount).toBe('');
        });

        test('still recurses into plain objects, including null-prototype ones', () => {
            const bare = Object.create(null);
            bare.c = '';
            const out = sanitize({ a: { b: '' }, bare }, { deep: true }) as any;
            expect(out.a).toEqual({ b: null });
            expect(out.bare.c).toBeNull();
        });
    });
});
