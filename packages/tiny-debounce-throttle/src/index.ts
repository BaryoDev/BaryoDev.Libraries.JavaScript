export interface DebounceOptions {
    /** Fire on leading edge (default: false) */
    leading?: boolean;
    /** Fire on trailing edge (default: true) */
    trailing?: boolean;
    /** Maximum wait time in ms */
    maxWait?: number;
}

export interface DebouncedFunction<T extends (...args: unknown[]) => unknown> {
    (...args: Parameters<T>): void;
    /** Cancel pending execution */
    cancel: () => void;
    /** Immediately execute pending function */
    flush: () => void;
    /** Check if there's a pending execution */
    pending: () => boolean;
}

/**
 * Creates a debounced function that delays invoking func until after wait ms
 * have elapsed since the last time the debounced function was invoked.
 *
 * @example
 * const search = debounce(fetchResults, 300);
 * search('query');
 * search.cancel(); // Cancel pending
 * search.flush();  // Execute immediately
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number,
    options: DebounceOptions = {}
): DebouncedFunction<T> {
    const { leading = false, trailing = true, maxWait } = options;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let maxTimeoutId: ReturnType<typeof setTimeout> | undefined;
    let lastArgs: Parameters<T> | undefined;
    let lastThis: unknown;
    let lastCallTime: number | undefined;

    function invokeFunc() {
        const args = lastArgs;
        const thisArg = lastThis;
        lastArgs = undefined;
        lastThis = undefined;
        if (args) {
            func.apply(thisArg, args);
        }
    }

    function cancel() {
        if (timeoutId) clearTimeout(timeoutId);
        if (maxTimeoutId) clearTimeout(maxTimeoutId);
        timeoutId = undefined;
        maxTimeoutId = undefined;
        lastArgs = undefined;
        lastThis = undefined;
        lastCallTime = undefined;
    }

    function flush() {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = undefined;
        }
        if (maxTimeoutId) {
            clearTimeout(maxTimeoutId);
            maxTimeoutId = undefined;
        }
        if (lastArgs) {
            invokeFunc();
        }
    }

    function pending() {
        return timeoutId !== undefined;
    }

    const debounced = function (this: unknown, ...args: Parameters<T>) {
        const time = Date.now();
        const isInvoking = lastCallTime === undefined;

        lastArgs = args;
        lastThis = this;
        lastCallTime = time;

        if (isInvoking && leading) {
            invokeFunc();
        }

        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        if (trailing) {
            timeoutId = setTimeout(() => {
                timeoutId = undefined;
                if (maxTimeoutId) {
                    clearTimeout(maxTimeoutId);
                    maxTimeoutId = undefined;
                }
                if (!leading || lastArgs !== undefined) {
                    invokeFunc();
                }
                lastCallTime = undefined;
            }, wait);
        }

        if (maxWait !== undefined && !maxTimeoutId) {
            maxTimeoutId = setTimeout(() => {
                maxTimeoutId = undefined;
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = undefined;
                }
                invokeFunc();
                lastCallTime = undefined;
            }, maxWait);
        }
    } as DebouncedFunction<T>;

    debounced.cancel = cancel;
    debounced.flush = flush;
    debounced.pending = pending;

    return debounced;
}

export interface ThrottledFunction<T extends (...args: unknown[]) => unknown> {
    (...args: Parameters<T>): void;
    /** Cancel pending trailing execution */
    cancel: () => void;
}

/**
 * Creates a throttled function that only invokes func at most once per wait ms.
 *
 * @example
 * const update = throttle(updatePosition, 16); // ~60fps
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
): ThrottledFunction<T> {
    let inThrottle = false;
    let lastArgs: Parameters<T> | undefined;
    let lastThis: unknown;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    function cancel() {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = undefined;
        }
        inThrottle = false;
        lastArgs = undefined;
        lastThis = undefined;
    }

    const throttled = function (this: unknown, ...args: Parameters<T>) {
        lastArgs = args;
        lastThis = this;

        if (!inThrottle) {
            func.apply(this, args);
            lastArgs = undefined;
            lastThis = undefined;
            inThrottle = true;
            timeoutId = setTimeout(() => {
                inThrottle = false;
                if (lastArgs) {
                    throttled.apply(lastThis, lastArgs);
                }
            }, wait);
        }
    } as ThrottledFunction<T>;

    throttled.cancel = cancel;

    return throttled;
}

/**
 * Creates a throttled function that uses requestAnimationFrame for ~60fps.
 */
throttle.raf = function <T extends (...args: unknown[]) => unknown>(
    func: T
): ThrottledFunction<T> {
    let rafId: number | undefined;
    let lastArgs: Parameters<T> | undefined;
    let lastThis: unknown;

    function cancel() {
        if (rafId !== undefined) {
            cancelAnimationFrame(rafId);
            rafId = undefined;
        }
        lastArgs = undefined;
    }

    const throttled = function (this: unknown, ...args: Parameters<T>) {
        lastArgs = args;
        lastThis = this;

        if (rafId === undefined) {
            rafId = requestAnimationFrame(() => {
                rafId = undefined;
                if (lastArgs) {
                    func.apply(lastThis, lastArgs);
                    lastArgs = undefined;
                }
            });
        }
    } as ThrottledFunction<T>;

    throttled.cancel = cancel;

    return throttled;
};
