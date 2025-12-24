export interface SlugifyOptions {
    /** Separator character (default: '-') */
    separator?: string;
    /** Maximum length of the slug */
    maxLength?: number;
    /** Custom replacement map for special characters */
    replacements?: Record<string, string>;
}

const defaultReplacements: Record<string, string> = {
    '&': 'and',
    '@': 'at',
    '#': 'hash',
    '%': 'percent',
    '+': 'plus',
    '=': 'equals'
};

/**
 * Generates a URL-safe slug from the given text.
 * Uses NFD normalization to handle accented characters properly.
 *
 * @example
 * slugify('Hello World'); // => 'hello-world'
 * slugify('Café Résumé'); // => 'cafe-resume'
 * slugify('Rock & Roll', { replacements: { '&': 'and' } }); // => 'rock-and-roll'
 */
export function slugify(text: string, options: SlugifyOptions = {}): string {
    const { separator = '-', maxLength, replacements = {} } = options;

    if (!text) return '';

    // Apply custom replacements first
    const allReplacements = { ...defaultReplacements, ...replacements };
    let result = text;
    for (const [char, replacement] of Object.entries(allReplacements)) {
        result = result.split(char).join(` ${replacement} `);
    }

    // Normalize, remove diacritics, clean up
    result = result
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-z0-9\s\-_]/gi, '') // Remove special chars
        .trim()
        .replace(/[\s\-_]+/g, separator) // Replace spaces/dashes
        .toLowerCase();

    // Remove leading/trailing separators
    while (result.startsWith(separator)) result = result.slice(separator.length);
    while (result.endsWith(separator)) result = result.slice(0, -separator.length);

    // Apply max length if specified
    if (maxLength && result.length > maxLength) {
        result = result.slice(0, maxLength);
        // Don't end with a separator
        while (result.endsWith(separator)) result = result.slice(0, -separator.length);
    }

    return result;
}

export default slugify;
