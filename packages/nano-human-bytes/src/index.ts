export interface FormatOptions {
    /** Use bits instead of bytes (default: false) */
    bits?: boolean;
    /** Use binary (1024) or decimal (1000) units (default: 'binary') */
    standard?: 'binary' | 'decimal';
    /** Decimal places (default: 2) */
    decimals?: number;
    /** Locale for number formatting (default: 'en') */
    locale?: string;
    /** Include space between number and unit (default: true) */
    space?: boolean;
    /** Unit display: 'short' (KB) or 'long' (Kilobytes) */
    unitDisplay?: 'short' | 'long';
}

const BINARY_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'];
const BINARY_UNITS_LONG = ['Bytes', 'Kilobytes', 'Megabytes', 'Gigabytes', 'Terabytes', 'Petabytes', 'Exabytes'];
const BIT_UNITS = ['b', 'Kb', 'Mb', 'Gb', 'Tb', 'Pb', 'Eb'];
const BIT_UNITS_LONG = ['bits', 'Kilobits', 'Megabits', 'Gigabits', 'Terabits', 'Petabits', 'Exabits'];

/**
 * Formats bytes into a human-readable string.
 *
 * @example
 * formatBytes(1536);              // '1.5 KB'
 * formatBytes(1536, { bits: true }); // '12.29 Kb'
 * formatBytes(1536, { locale: 'de' }); // '1,5 KB'
 */
export function formatBytes(bytes: number, options: FormatOptions = {}): string {
    const {
        bits = false,
        standard = 'binary',
        decimals = 2,
        locale = 'en',
        space = true,
        unitDisplay = 'short'
    } = options;

    if (bytes === 0) {
        const unit = bits
            ? (unitDisplay === 'long' ? 'bits' : 'b')
            : (unitDisplay === 'long' ? 'Bytes' : 'B');
        return `0${space ? ' ' : ''}${unit}`;
    }

    const absBytes = Math.abs(bytes);
    const base = standard === 'binary' ? 1024 : 1000;
    const value = bits ? absBytes * 8 : absBytes;

    const units = bits
        ? (unitDisplay === 'long' ? BIT_UNITS_LONG : BIT_UNITS)
        : (unitDisplay === 'long' ? BINARY_UNITS_LONG : BINARY_UNITS);

    const exponent = Math.min(
        Math.floor(Math.log(value) / Math.log(base)),
        units.length - 1
    );

    const result = value / Math.pow(base, exponent);
    const sign = bytes < 0 ? '-' : '';

    const formatted = result.toLocaleString(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals
    });

    return `${sign}${formatted}${space ? ' ' : ''}${units[exponent]}`;
}

/**
 * Parses a human-readable byte string back to bytes.
 *
 * @example
 * parseBytes('1.5 KB');  // 1536
 * parseBytes('1 GB');    // 1073741824
 * parseBytes('12 Kb');   // 1536 (bits)
 */
export function parseBytes(input: string): number {
    const str = input.trim().toLowerCase();
    const match = str.match(/^(-?\d+\.?\d*)\s*([a-z]+)?$/i);

    if (!match) {
        throw new Error(`Invalid byte string: ${input}`);
    }

    const value = parseFloat(match[1]);
    const unitRaw = match[2] || 'b';
    const unit = unitRaw.toLowerCase();


    const unitMap: Record<string, number> = {
        'b': 1,
        'kb': 1024,
        'mb': 1024 ** 2,
        'gb': 1024 ** 3,
        'tb': 1024 ** 4,
        'pb': 1024 ** 5,
        'eb': 1024 ** 6,
        // Long names
        'bytes': 1,
        'kilobytes': 1024,
        'megabytes': 1024 ** 2,
        'gigabytes': 1024 ** 3,
        'terabytes': 1024 ** 4,
        'petabytes': 1024 ** 5,
        'exabytes': 1024 ** 6,
        // Bits
        'bit': 1 / 8,
        'bits': 1 / 8,
        'kilobit': 1024 / 8,
        'kilobits': 1024 / 8,
        'megabit': (1024 ** 2) / 8,
        'megabits': (1024 ** 2) / 8
    };

    const multiplier = unitMap[unit] ?? 1;
    return Math.round(value * multiplier);
}

export default formatBytes;
