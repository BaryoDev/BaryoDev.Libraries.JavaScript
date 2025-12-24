export interface CleanOptions {
    /** Custom predicate to determine if value should be kept */
    predicate?: (value: unknown, key: string, path: string) => boolean;
    /** Keep empty arrays (default: false) */
    preserveEmptyArrays?: boolean;
    /** Keep empty objects (default: false) */
    preserveEmptyObjects?: boolean;
    /** Keep empty strings (default: false - they are removed) */
    preserveEmptyStrings?: boolean;
    /** Paths to exclude from cleaning (supports wildcards) */
    exclude?: string[];
    /** Transform values while cleaning */
    transform?: (value: unknown, key: string) => unknown;
}

const defaultPredicate = (value: unknown, _key: string, _path: string, options: CleanOptions): boolean => {
    if (value === null || value === undefined) return false;
    if (!options.preserveEmptyStrings && value === '') return false;
    return true;
};

function matchesPath(path: string, patterns: string[]): boolean {
    return patterns.some(pattern => {
        if (pattern.endsWith('*')) {
            return path.startsWith(pattern.slice(0, -1));
        }
        return path === pattern;
    });
}

/**
 * Deeply cleans an object by removing null, undefined, and empty string values.
 * Preserves 0 and false.
 */
export function clean<T>(input: T, options: CleanOptions = {}): T {
    const { exclude = [], transform } = options;

    function cleanRecursive(value: unknown, key: string, path: string): unknown {
        // Apply transform if provided
        let processedValue = value;
        if (transform && key !== '') {
            processedValue = transform(value, key);
        }

        // Check if path is excluded
        if (path && matchesPath(path, exclude)) {
            return processedValue;
        }

        // Use custom predicate or default
        const predicate = options.predicate ?? ((v, k, p) => defaultPredicate(v, k, p, options));

        if (typeof processedValue !== 'object' || processedValue === null) {
            return processedValue;
        }

        if (processedValue instanceof Date || processedValue instanceof RegExp) {
            return processedValue;
        }

        if (Array.isArray(processedValue)) {
            const cleaned = processedValue
                .map((item, index) => cleanRecursive(item, String(index), path ? `${path}[${index}]` : `[${index}]`))
                .filter((item) => predicate(item, '', path));

            if (!options.preserveEmptyArrays && cleaned.length === 0) {
                return undefined;
            }
            return cleaned;
        }

        const result: Record<string, unknown> = {};
        for (const k in processedValue as Record<string, unknown>) {
            if (Object.prototype.hasOwnProperty.call(processedValue, k)) {
                const childPath = path ? `${path}.${k}` : k;
                const cleanedValue = cleanRecursive((processedValue as Record<string, unknown>)[k], k, childPath);

                if (predicate(cleanedValue, k, childPath)) {
                    result[k] = cleanedValue;
                }
            }
        }

        if (!options.preserveEmptyObjects && Object.keys(result).length === 0) {
            return undefined;
        }

        return result;
    }

    const result = cleanRecursive(input, '', '');
    return result as T;
}

export { clean as cleanObject };
export default clean;
