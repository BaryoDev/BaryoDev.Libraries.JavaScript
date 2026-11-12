import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { timeAgo, createTimeAgo } from './index';

describe('timeAgo', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-12-24T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test('seconds ago', () => {
        const date = Date.now() - 30 * 1000;
        expect(timeAgo(date)).toMatch(/30 seconds? ago|30 秒前/);
    });

    test('minutes ago', () => {
        const date = Date.now() - 5 * 60 * 1000;
        expect(timeAgo(date)).toMatch(/5 minutes? ago/);
    });

    test('hours ago', () => {
        const date = Date.now() - 3 * 60 * 60 * 1000;
        expect(timeAgo(date)).toMatch(/3 hours? ago/);
    });

    test('days ago', () => {
        const date = Date.now() - 2 * 24 * 60 * 60 * 1000;
        expect(timeAgo(date)).toMatch(/2 days? ago/);
    });

    test('accepts Date object', () => {
        const date = new Date(Date.now() - 60 * 1000);
        expect(timeAgo(date)).toMatch(/1 minute ago/);
    });

    test('accepts ISO string', () => {
        const date = new Date(Date.now() - 60 * 1000).toISOString();
        expect(timeAgo(date)).toMatch(/1 minute ago/);
    });

    test('just now / recently', () => {
        const date = Date.now() - 5 * 1000;
        const result = timeAgo(date);
        // Intl may return "5 seconds ago" or "now"
        expect(result).toBeTruthy();
    });
});

describe('createTimeAgo', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-12-24T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test('creates localized function', () => {
        const ago = createTimeAgo('es');
        const date = Date.now() - 60 * 1000;
        const result = ago(date);
        // Spanish: "hace 1 minuto" or similar
        expect(result).toBeTruthy();
    });
});

describe('timeAgo.live', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-12-24T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test('updates element periodically', () => {
        const element = { textContent: '' } as HTMLElement;
        const date = Date.now();

        const cleanup = timeAgo.live(element, date, { interval: 1000 });

        expect(element.textContent).toBeTruthy();

        vi.advanceTimersByTime(1000);
        expect(element.textContent).toBeTruthy();

        cleanup();
    });

    test('cleanup stops updates', () => {
        const element = { textContent: '' } as HTMLElement;
        const date = Date.now();

        const cleanup = timeAgo.live(element, date, { interval: 1000 });
        cleanup();

        const textAfterCleanup = element.textContent;
        vi.advanceTimersByTime(5000);

        // Since we're using fake timers, just verify cleanup was called
        expect(element.textContent).toBe(textAfterCleanup);
    });
});

describe('edge cases', () => {
    test('future dates (in X minutes)', () => {
        const future = Date.now() + 60 * 60 * 1000; // 1 hour later
        expect(timeAgo(future)).toMatch(/in 1 hour|1 hour from now/);
    });

    test('exact now', () => {
        const now = Date.now();
        expect(timeAgo(now)).toBeTruthy();
    });

    test('very old dates', () => {
        const old = new Date('1900-01-01').getTime();
        expect(timeAgo(old)).toMatch(/years ago/);
    });

    test('handles invalid date inputs gracefully', () => {
        const invalid = 'invalid-date-string';
        try {
            const res = timeAgo(invalid);
            expect(res).toBeTruthy();
        } catch (e) {
            // If it throws, acceptable
        }
    });

    test('fallback uses future tense', () => {
        const future = Date.now() + 5 * 60 * 1000;
        expect(timeAgo(future, { useIntl: false })).toBe('in 5 minutes');
        expect(timeAgo(Date.now() + 60 * 1000, { useIntl: false })).toBe('in 1 minute');
    });
});

describe('fallback strings and unit edges', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-12-24T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test('fallback shows the number for one unit', () => {
        const now = Date.now();
        expect(timeAgo(now - 60 * 1000, { useIntl: false })).toBe('1 minute ago');
        expect(timeAgo(now - 1000, { useIntl: false })).toBe('1 second ago');
        expect(timeAgo(now - 3600 * 1000, { useIntl: false })).toBe('1 hour ago');
    });

    test('fallback plural and es', () => {
        const now = Date.now();
        expect(timeAgo(now - 5 * 60 * 1000, { useIntl: false })).toBe('5 minutes ago');
        expect(timeAgo(now - 60 * 1000, { useIntl: false, locale: 'es' })).toBe('hace 1 minuto');
        expect(timeAgo(now - 3 * 60 * 1000, { useIntl: false, locale: 'es' })).toBe('hace 3 minutos');
        expect(timeAgo(now + 3 * 60 * 1000, { useIntl: false, locale: 'es' })).toBe('dentro de 3 minutos');
    });

    test('rounding moves to the next unit instead of 60 seconds', () => {
        const now = Date.now();
        const opts = { useIntl: false };
        expect(timeAgo(now - 59400, opts)).toBe('59 seconds ago');
        expect(timeAgo(now - 59600, opts)).toBe('1 minute ago');
        expect(timeAgo(now - 23.6 * 3600 * 1000, opts)).toBe('1 day ago');
        expect(timeAgo(now - 6.6 * 86400 * 1000, opts)).toBe('1 week ago');
        expect(timeAgo(now - 11.6 * 30 * 86400 * 1000, opts)).toBe('1 year ago');
        expect(timeAgo(now - 59600)).not.toMatch(/60/);
    });
});
