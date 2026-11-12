export interface TimeAgoOptions {
    /** Locale for formatting (default: 'en') */
    locale?: string;
    /** Use Intl.RelativeTimeFormat if available (default: true) */
    useIntl?: boolean;
}

type TimeUnit = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

interface TimeThreshold {
    unit: TimeUnit;
    ms: number;
    max: number;
}

const THRESHOLDS: TimeThreshold[] = [
    { unit: 'second', ms: 1000, max: 60 },
    { unit: 'minute', ms: 60 * 1000, max: 60 },
    { unit: 'hour', ms: 60 * 60 * 1000, max: 24 },
    { unit: 'day', ms: 24 * 60 * 60 * 1000, max: 7 },
    { unit: 'week', ms: 7 * 24 * 60 * 60 * 1000, max: 4 },
    { unit: 'month', ms: 30 * 24 * 60 * 60 * 1000, max: 12 },
    { unit: 'year', ms: 365 * 24 * 60 * 60 * 1000, max: Infinity }
];

// Fallback strings for when Intl.RelativeTimeFormat is not available
interface FallbackLocale {
    past: (n: number, noun: string) => string;
    future: (n: number, noun: string) => string;
    nouns: Record<TimeUnit, { singular: string; plural: string }>;
}

const FALLBACK_STRINGS: Record<string, FallbackLocale> = {
    en: {
        past: (n, noun) => `${n} ${noun} ago`,
        future: (n, noun) => `in ${n} ${noun}`,
        nouns: {
            second: { singular: 'second', plural: 'seconds' },
            minute: { singular: 'minute', plural: 'minutes' },
            hour: { singular: 'hour', plural: 'hours' },
            day: { singular: 'day', plural: 'days' },
            week: { singular: 'week', plural: 'weeks' },
            month: { singular: 'month', plural: 'months' },
            year: { singular: 'year', plural: 'years' }
        }
    },
    es: {
        past: (n, noun) => `hace ${n} ${noun}`,
        future: (n, noun) => `dentro de ${n} ${noun}`,
        nouns: {
            second: { singular: 'segundo', plural: 'segundos' },
            minute: { singular: 'minuto', plural: 'minutos' },
            hour: { singular: 'hora', plural: 'horas' },
            day: { singular: 'día', plural: 'días' },
            week: { singular: 'semana', plural: 'semanas' },
            month: { singular: 'mes', plural: 'meses' },
            year: { singular: 'año', plural: 'años' }
        }
    }
};

function formatFallback(value: number, unit: TimeUnit, locale: string): string {
    const strings = FALLBACK_STRINGS[locale] ?? FALLBACK_STRINGS.en;
    const absValue = Math.abs(value);
    const nouns = strings.nouns[unit];
    const noun = absValue === 1 ? nouns.singular : nouns.plural;

    return value > 0 ? strings.future(absValue, noun) : strings.past(absValue, noun);
}

/**
 * Formats a timestamp as a relative time string.
 *
 * @example
 * timeAgo(Date.now() - 60000);        // '1 minute ago'
 * timeAgo(new Date('2024-12-23'));    // '1 day ago'
 */
export function timeAgo(
    date: Date | number | string,
    options: TimeAgoOptions = {}
): string {
    const { locale = 'en', useIntl = true } = options;

    const timestamp = typeof date === 'string' ? new Date(date).getTime() :
        date instanceof Date ? date.getTime() : date;

    const now = Date.now();
    const diff = now - timestamp;
    const absDiff = Math.abs(diff);

    // Find appropriate unit
    let unit: TimeUnit = 'second';
    let value = 0;

    for (const threshold of THRESHOLDS) {
        // Round first, so 59.6 seconds is "1 minute" and not "60 seconds"
        const rounded = Math.round(absDiff / threshold.ms);
        if (rounded < threshold.max) {
            unit = threshold.unit;
            value = rounded;
            break;
        }
    }

    // Use future tense for future dates
    const isFuture = diff < 0;
    value = isFuture ? value : -value;

    // Try Intl.RelativeTimeFormat if available
    if (useIntl && typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
        try {
            const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
            return rtf.format(value, unit);
        } catch {
            // Fallback if locale not supported
        }
    }

    return formatFallback(value, unit, locale);
}

/**
 * Creates a timeAgo function with preset options.
 */
export function createTimeAgo(locale: string) {
    return (date: Date | number | string) => timeAgo(date, { locale });
}

/**
 * Live updates an element with relative time.
 * Returns a cleanup function.
 */
timeAgo.live = function (
    element: HTMLElement,
    date: Date | number | string,
    options: TimeAgoOptions & { interval?: number } = {}
): () => void {
    const { interval = 60000, ...timeAgoOptions } = options;

    const update = () => {
        element.textContent = timeAgo(date, timeAgoOptions);
    };

    update();
    const intervalId = setInterval(update, interval);

    return () => clearInterval(intervalId);
};

export default timeAgo;
