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
const FALLBACK_STRINGS: Record<string, Record<TimeUnit, { singular: string; plural: string }>> = {
    en: {
        second: { singular: 'second ago', plural: 'seconds ago' },
        minute: { singular: 'minute ago', plural: 'minutes ago' },
        hour: { singular: 'hour ago', plural: 'hours ago' },
        day: { singular: 'day ago', plural: 'days ago' },
        week: { singular: 'week ago', plural: 'weeks ago' },
        month: { singular: 'month ago', plural: 'months ago' },
        year: { singular: 'year ago', plural: 'years ago' }
    },
    es: {
        second: { singular: 'hace 1 segundo', plural: 'hace {n} segundos' },
        minute: { singular: 'hace 1 minuto', plural: 'hace {n} minutos' },
        hour: { singular: 'hace 1 hora', plural: 'hace {n} horas' },
        day: { singular: 'hace 1 día', plural: 'hace {n} días' },
        week: { singular: 'hace 1 semana', plural: 'hace {n} semanas' },
        month: { singular: 'hace 1 mes', plural: 'hace {n} meses' },
        year: { singular: 'hace 1 año', plural: 'hace {n} años' }
    }
};

function formatFallback(value: number, unit: TimeUnit, locale: string): string {
    const strings = FALLBACK_STRINGS[locale] ?? FALLBACK_STRINGS.en;
    const absValue = Math.abs(value);

    if (absValue === 1) {
        return strings[unit].singular;
    }

    return strings[unit].plural.includes('{n}')
        ? strings[unit].plural.replace('{n}', String(absValue))
        : `${absValue} ${strings[unit].plural}`;
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
        if (absDiff < threshold.ms * threshold.max) {
            unit = threshold.unit;
            value = Math.round(absDiff / threshold.ms);
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
