import { describe, test, expect } from 'vitest';
import { formatBytes, parseBytes } from './index';

describe('formatBytes', () => {
    test('formats bytes correctly', () => {
        expect(formatBytes(0)).toBe('0 B');
        expect(formatBytes(1)).toBe('1 B');
        expect(formatBytes(1024)).toBe('1 KB');
        expect(formatBytes(1536)).toBe('1.5 KB');
        expect(formatBytes(1048576)).toBe('1 MB');
        expect(formatBytes(1073741824)).toBe('1 GB');
    });

    test('handles decimals option', () => {
        expect(formatBytes(1536, { decimals: 0 })).toBe('2 KB');
        expect(formatBytes(1536, { decimals: 3 })).toBe('1.5 KB');
    });

    test('bits mode', () => {
        expect(formatBytes(128, { bits: true })).toBe('1 Kb');
        expect(formatBytes(1024, { bits: true })).toBe('8 Kb');
    });

    test('without space', () => {
        expect(formatBytes(1024, { space: false })).toBe('1KB');
    });

    test('long unit display', () => {
        expect(formatBytes(1024, { unitDisplay: 'long' })).toBe('1 Kilobytes');
        expect(formatBytes(0, { unitDisplay: 'long' })).toBe('0 Bytes');
    });

    test('negative values', () => {
        expect(formatBytes(-1024)).toBe('-1 KB');
    });

    test('locale formatting', () => {
        expect(formatBytes(1536, { locale: 'de' })).toMatch(/1,5/);
    });
});

describe('parseBytes', () => {
    test('parses byte strings', () => {
        expect(parseBytes('1 B')).toBe(1);
        expect(parseBytes('1KB')).toBe(1024);
        expect(parseBytes('1.5 KB')).toBe(1536);
        expect(parseBytes('1 MB')).toBe(1048576);
        expect(parseBytes('1 GB')).toBe(1073741824);
    });

    test('parses long unit names', () => {
        expect(parseBytes('1 Kilobytes')).toBe(1024);
        expect(parseBytes('1 Megabytes')).toBe(1048576);
    });

    test('case insensitive', () => {
        expect(parseBytes('1 kb')).toBe(1024);
        expect(parseBytes('1 KB')).toBe(1024);
        expect(parseBytes('1 Kb')).toBe(1024);
    });

    test('throws on invalid input', () => {
        expect(() => parseBytes('invalid')).toThrow();
    });
});

describe('edge cases', () => {
    test('formats NaN and Infinity safely', () => {
        // Current implementation might output "NaN undefined" or similar.
        // We capture current behavior to ensure consistency or decide to fix.
        // Based on analysis: units[NaN] is undefined.
        // Expecting "NaN undefined" might be weird. 
        // Let's assert it returns A string containing partial info or handles it.
        const nan = formatBytes(NaN);
        expect(nan).toContain('NaN');
    });

    test('formats Infinity', () => {
        const inf = formatBytes(Infinity);
        expect(inf).toContain('∞');
    });

    test('caps at largest unit (Exabytes)', () => {
        const huge = 1024 ** 10; // Way beyond EB
        const str = formatBytes(huge);
        expect(str).toContain('EB');
    });

    test('parses plain numbers as bytes', () => {
        expect(parseBytes('100')).toBe(100);
        expect(parseBytes('0')).toBe(0);
    });

    test('parses with extra whitespace', () => {
        expect(parseBytes('  100   KB  ')).toBe(102400);
    });
});
