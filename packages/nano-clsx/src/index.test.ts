import { describe, test, expect } from 'vitest';
import { clsx } from './index';

describe('clsx', () => {
    test('strings', () => {
        expect(clsx('a', 'b')).toBe('a b');
        expect(clsx('one', 'two', 'three')).toBe('one two three');
    });

    test('conditionals (falsy values)', () => {
        expect(clsx('a', false, 'b', null)).toBe('a b');
        expect(clsx('foo', undefined, 0, 'bar')).toBe('foo bar');
        expect(clsx(null, false, 'test', undefined)).toBe('test');
    });

    test('objects', () => {
        expect(clsx({ a: true, b: false, c: 1 })).toBe('a c');
        expect(clsx({ 'btn-primary': true, 'hidden': 0 })).toBe('btn-primary');
        expect(clsx({ foo: true }, { bar: true })).toBe('foo bar');
    });

    test('arrays', () => {
        expect(clsx(['a', ['b', { c: true }]])).toBe('a b c');
        expect(clsx(['one', 'two'])).toBe('one two');
        expect(clsx([['nested']])).toBe('nested');
    });

    test('numbers', () => {
        expect(clsx(1, 2)).toBe('1 2');
        expect(clsx('foo', 5)).toBe('foo 5');
    });

    test('kitchen sink', () => {
        expect(
            clsx(
                'header',
                [1, 'foo', null, false],
                { nested: true, ignored: false },
                ['bar', { baz: 1 }]
            )
        ).toBe('header 1 foo nested bar baz');
    });

    test('empty inputs', () => {
        expect(clsx()).toBe('');
        expect(clsx(null)).toBe('');
        expect(clsx(undefined)).toBe('');
        expect(clsx(false)).toBe('');
    });

    describe('edge cases', () => {
        test('ignores inherited properties', () => {
            const proto = { inherited: true };
            const obj = Object.create(proto);
            obj.own = true;
            expect(clsx(obj)).toBe('own');
        });

        test('handles deep array nesting', () => {
            const input = ['a', ['b', ['c', ['d']]]];
            expect(clsx(input)).toBe('a b c d');
        });

        test('handles mixed types in array', () => {
            const input = ['a', { b: true, c: false }, 'd', null, undefined];
            expect(clsx(input)).toBe('a b d');
        });

        test('handles special keys', () => {
            expect(clsx({ 'foo bar': true, 'baz': true })).toBe('foo bar baz');
        });
    });
});
