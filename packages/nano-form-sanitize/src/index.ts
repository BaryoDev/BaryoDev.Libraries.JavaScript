/**
 * Options for sanitizing form values.
 */
export interface SanitizeOptions {
    /** Convert empty strings (`""`) to `null`. Default: `true` */
    emptyToNull?: boolean;
    /** Trim whitespace from string values. Default: `false` */
    trim?: boolean;
    /** Recurse into nested objects. Default: `false` */
    deep?: boolean;
}

const defaults: Required<SanitizeOptions> = {
    emptyToNull: true,
    trim: false,
    deep: false,
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
    if (typeof value !== 'object' || value === null) return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
}

function processValue(value: unknown, opts: Required<SanitizeOptions>): unknown {
    if (typeof value === 'string') {
        let v = opts.trim ? value.trim() : value;
        if (opts.emptyToNull && v === '') return null;
        return v;
    }

    // Only plain objects are copied. File, Blob, Map, Set, URL, Date and class
    // instances are returned as they are.
    if (opts.deep && isPlainObject(value)) {
        return sanitizeObject(value, opts);
    }

    return value;
}

function sanitizeObject<T extends Record<string, unknown>>(values: T, opts: Required<SanitizeOptions>): T {
    return Object.fromEntries(
        Object.entries(values).map(([k, v]) => [k, processValue(v, opts)])
    ) as T;
}

/**
 * Sanitizes form values for API submission.
 *
 * By default converts empty strings to `null`, which is the most common need
 * when submitting HTML form data to typed REST APIs (e.g., .NET `DateOnly?`).
 *
 * @example
 * ```ts
 * sanitize({ name: "Jo", dob: "" })
 * // => { name: "Jo", dob: null }
 *
 * sanitize({ note: "  hi  " }, { trim: true })
 * // => { note: "hi" }
 *
 * sanitize({ addr: { city: "" } }, { deep: true })
 * // => { addr: { city: null } }
 * ```
 */
export function sanitize<T extends Record<string, unknown>>(values: T, options?: SanitizeOptions): T {
    const opts = { ...defaults, ...options };
    return sanitizeObject(values, opts);
}

export default sanitize;
