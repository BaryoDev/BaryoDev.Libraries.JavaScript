import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce, throttle } from './index';

describe('debounce', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test('delays execution', () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        debounced();
        expect(fn).not.toHaveBeenCalled();

        vi.advanceTimersByTime(100);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('cancel prevents execution', () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        debounced();
        debounced.cancel();
        vi.advanceTimersByTime(100);

        expect(fn).not.toHaveBeenCalled();
    });

    test('flush executes immediately', () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        debounced();
        debounced.flush();

        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('pending returns correct state', () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        expect(debounced.pending()).toBe(false);
        debounced();
        expect(debounced.pending()).toBe(true);
        vi.advanceTimersByTime(100);
        expect(debounced.pending()).toBe(false);
    });

    test('leading option fires immediately', () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100, { leading: true, trailing: false });

        debounced();
        expect(fn).toHaveBeenCalledTimes(1);

        debounced();
        vi.advanceTimersByTime(100);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('maxWait ensures execution', () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100, { maxWait: 150 });

        debounced();
        vi.advanceTimersByTime(50);
        debounced();
        vi.advanceTimersByTime(50);
        debounced();
        vi.advanceTimersByTime(50);

        expect(fn).toHaveBeenCalledTimes(1);
    });
});

describe('throttle', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test('fires immediately', () => {
        const fn = vi.fn();
        const throttled = throttle(fn, 100);

        throttled();
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('limits subsequent calls', () => {
        const fn = vi.fn();
        const throttled = throttle(fn, 100);

        throttled();
        throttled();
        throttled();

        expect(fn).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(100);
        expect(fn).toHaveBeenCalledTimes(2);
    });

    test('cancel prevents trailing call', () => {
        const fn = vi.fn();
        const throttled = throttle(fn, 100);

        throttled();
        throttled();
        throttled.cancel();
        vi.advanceTimersByTime(100);

        expect(fn).toHaveBeenCalledTimes(1);
    });
});

describe('edge cases', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    test('throttle 0ms', () => {
        const fn = vi.fn();
        const throttled = throttle(fn, 0);

        throttled();
        throttled();
        throttled();

        expect(fn).toHaveBeenCalledTimes(1);
        vi.advanceTimersByTime(1);
        expect(fn).toHaveBeenCalledTimes(2);
    });

    test('debounce 0ms', () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 0);
        debounced();
        expect(fn).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(fn).toHaveBeenCalledTimes(1);
    });
});
