export type ArrayMergeStrategy = 'replace' | 'concat' | 'union';

export interface MergeOptions {
    /** How to merge arrays (default: 'replace') */
    arrayMerge?: ArrayMergeStrategy | ((target: unknown[], source: unknown[]) => unknown[]);
    /** Custom merge function for specific keys */
    customMerge?: (key: string) => ((a: unknown, b: unknown) => unknown) | undefined;
}

/**
 * Checks if a value is a plain object (not array, Date, RegExp, etc.)
 */
function isPlainObject(item: unknown): item is Record<string, unknown> {
    return (
        item !== null &&
        typeof item === 'object' &&
        (item as object).constructor === Object
    );
}

/**
 * Deep clones a value.
 */
export function cloneDeep<T>(value: T, seen = new WeakMap()): T {
    if (value === null || typeof value !== 'object') {
        return value;
    }

    // Handle circular references
    if (seen.has(value as object)) {
        return seen.get(value as object);
    }

    if (Array.isArray(value)) {
        const clone: unknown[] = [];
        seen.set(value, clone);
        for (let i = 0; i < value.length; i++) {
            clone[i] = cloneDeep(value[i], seen);
        }
        return clone as T;
    }

    if (value instanceof Date) {
        return new Date(value.getTime()) as T;
    }

    if (value instanceof RegExp) {
        return new RegExp(value.source, value.flags) as T;
    }

    if (isPlainObject(value)) {
        const clone: Record<string, unknown> = {};
        seen.set(value, clone);
        for (const key of Object.keys(value)) {
            clone[key] = cloneDeep(value[key], seen);
        }
        return clone as T;
    }

    return value;
}

/**
 * Merges arrays based on the specified strategy.
 */
function mergeArrays(target: unknown[], source: unknown[], strategy: MergeOptions['arrayMerge']): unknown[] {
    if (typeof strategy === 'function') {
        return strategy(target, source);
    }

    switch (strategy) {
        case 'concat':
            return [...target, ...source];
        case 'union':
            return [...new Set([...target, ...source])];
        case 'replace':
        default:
            return source;
    }
}

/**
 * Deeply merges source into target.
 */
function deepMergeTwo(
    target: Record<string, unknown>,
    source: Record<string, unknown>,
    options: MergeOptions
): Record<string, unknown> {
    for (const key of Object.keys(source)) {
        // Prototype pollution protection
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            continue;
        }

        const sourceValue = source[key];
        const targetValue = target[key];

        // Check for custom merge function
        if (options.customMerge) {
            const customFn = options.customMerge(key);
            if (customFn) {
                target[key] = customFn(targetValue, sourceValue);
                continue;
            }
        }

        // Handle arrays
        if (Array.isArray(sourceValue)) {
            if (Array.isArray(targetValue)) {
                target[key] = mergeArrays(targetValue, sourceValue, options.arrayMerge);
            } else {
                target[key] = cloneDeep(sourceValue);
            }
            continue;
        }

        // Handle plain objects
        if (isPlainObject(sourceValue)) {
            if (isPlainObject(targetValue)) {
                deepMergeTwo(targetValue, sourceValue, options);
            } else {
                target[key] = cloneDeep(sourceValue);
            }
            continue;
        }

        // Primitives, Dates, RegExp, etc.
        target[key] = cloneDeep(sourceValue);
    }

    return target;
}

/**
 * Deeply merges multiple source objects into the target object.
 * Arrays and special types are overwritten by default.
 *
 * @example
 * merge({}, objA, objB);
 * merge({}, objA, objB, { arrayMerge: 'concat' });
 */
export function merge<T extends Record<string, unknown>>(
    target: T,
    ...sources: (Record<string, unknown> | MergeOptions)[]
): T {
    // Check if last argument is options
    let options: MergeOptions = {};
    let actualSources = sources;

    const lastArg = sources[sources.length - 1];
    if (lastArg && typeof lastArg === 'object' && ('arrayMerge' in lastArg || 'customMerge' in lastArg)) {
        options = lastArg as MergeOptions;
        actualSources = sources.slice(0, -1);
    }

    for (const source of actualSources) {
        if (isPlainObject(source)) {
            deepMergeTwo(target as Record<string, unknown>, source, options);
        }
    }

    return target;
}

export default merge;
