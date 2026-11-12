export interface ResilientOptions {
    /** Number of retry attempts (default: 3) */
    retries?: number;
    /** Delay between retries in ms (default: 1000) */
    retryDelay?: number;
    /** Request timeout in ms (default: 5000). 0 or Infinity means no timeout. */
    timeout?: number;
    /** Backoff strategy: 'fixed' | 'exponential' (default: 'fixed') */
    backoff?: 'fixed' | 'exponential';
    /** Custom condition to determine if request should be retried */
    retryOn?: (error: Error | null, response: Response | null) => boolean;
    /** Request interceptor */
    onRequest?: (url: string, options: RequestInit) => RequestInit | Promise<RequestInit>;
    /** Response interceptor */
    onResponse?: (response: Response) => Response | Promise<Response>;
    /** Error handler */
    onError?: (error: Error) => void;
}

/**
 * Calculates delay with optional exponential backoff and jitter.
 */
function calculateDelay(attempt: number, baseDelay: number, backoff: 'fixed' | 'exponential'): number {
    if (backoff === 'exponential') {
        const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 0.3 * exponentialDelay; // 0-30% jitter
        return exponentialDelay + jitter;
    }
    return baseDelay;
}

/**
 * Default retry condition: retry on network errors and 5xx responses.
 */
const defaultRetryOn = (_error: Error | null, response: Response | null): boolean => {
    if (!response) return true; // Network error
    return response.status >= 500;
};

/** Thrown for a non-ok response that is not retried. Never passed to retryOn. */
export class HttpStatusError extends Error {
    /** HTTP status code of the response */
    readonly status: number;
    /** The response, with its body unread so the caller can read the error body */
    readonly response: Response;

    constructor(response: Response) {
        super(`Request failed with status ${response.status}`);
        this.name = 'HttpStatusError';
        this.status = response.status;
        this.response = response;
    }
}

/** Largest delay setTimeout accepts; above it the timer fires after 1 ms. */
const MAX_TIMER_MS = 2147483647;

function abortReason(signal: AbortSignal): unknown {
    return signal.reason ?? new DOMException('This operation was aborted', 'AbortError');
}

/** Sleeps for ms, rejecting at once if the signal aborts. */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(abortReason(signal));
            return;
        }
        const onAbort = () => {
            clearTimeout(timer);
            reject(abortReason(signal!));
        };
        const timer = setTimeout(() => {
            signal?.removeEventListener('abort', onAbort);
            resolve();
        }, ms);
        signal?.addEventListener('abort', onAbort, { once: true });
    });
}

/** Releases the connection held by a response we will not read. */
async function discardBody(response: Response): Promise<void> {
    try {
        await response.body?.cancel();
    } catch {
        // already locked or closed
    }
}

/**
 * A resilient wrapper around the native fetch API with retry and timeout capabilities.
 *
 * @example
 * const response = await resilientFetch('https://api.example.com/data');
 * 
 * const response = await resilientFetch('https://api.example.com/data', {
 *   retries: 3,
 *   timeout: 10000,
 *   backoff: 'exponential'
 * });
 */
export async function resilientFetch(
    url: string | URL | Request,
    options: RequestInit & ResilientOptions = {}
): Promise<Response> {
    const {
        retries = 3,
        retryDelay = 1000,
        timeout = 5000,
        backoff = 'fixed',
        retryOn = defaultRetryOn,
        onRequest,
        onResponse,
        onError,
        ...fetchOptions
    } = options;

    let attempt = 0;
    const request = typeof Request !== 'undefined' && url instanceof Request ? url : undefined;
    let finalUrl = request ? request.url : url.toString();
    let finalOptions: RequestInit = fetchOptions;

    // Apply request interceptor
    if (onRequest) {
        finalOptions = await onRequest(finalUrl, fetchOptions);
    }

    const callerSignal = finalOptions.signal ?? request?.signal ?? undefined;

    while (true) {
        // Do not start an attempt after the caller aborted (also covers the backoff sleep)
        if (callerSignal?.aborted) {
            throw abortReason(callerSignal);
        }

        const controller = new AbortController();
        const timeoutId =
            timeout > 0 && timeout <= MAX_TIMER_MS
                ? setTimeout(() => controller.abort(), timeout)
                : undefined;
        const onCallerAbort = () => controller.abort();
        callerSignal?.addEventListener('abort', onCallerAbort, { once: true });

        let response: Response;
        try {
            // A Request is cloned per attempt so its body can be sent again
            response = await fetch(request ? request.clone() : finalUrl, {
                ...finalOptions,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                // Check if we should retry
                if (attempt < retries && retryOn(null, response)) {
                    attempt++;
                    await discardBody(response);
                    const delay = calculateDelay(attempt, retryDelay, backoff);
                    await sleep(delay, callerSignal);
                    continue;
                }
                throw new HttpStatusError(response);
            }
        } catch (error) {
            clearTimeout(timeoutId);

            // The caller aborted: surface the abort and never retry
            if (callerSignal?.aborted) {
                if (onError) {
                    onError(error as Error);
                }
                throw error;
            }

            // A non-ok HTTP response already went through retryOn above
            if (error instanceof HttpStatusError) {
                if (onError) {
                    onError(error);
                }
                throw error;
            }

            attempt++;

            const isAbort = (error as Error).name === 'AbortError';
            const err = isAbort ? new Error('Request timed out') : error as Error;

            // Call error handler
            if (onError) {
                onError(err);
            }

            // Check if we should retry
            if (attempt <= retries && retryOn(err, null)) {
                const delay = calculateDelay(attempt, retryDelay, backoff);
                await sleep(delay, callerSignal);
                continue;
            }

            throw err;
        } finally {
            callerSignal?.removeEventListener('abort', onCallerAbort);
        }

        // Apply response interceptor. Outside the try above, so an error it
        // throws is not mistaken for a network error and retried.
        if (onResponse) {
            try {
                return await onResponse(response);
            } catch (error) {
                if (onError) {
                    onError(error as Error);
                }
                throw error;
            }
        }

        return response;
    }
}

export default resilientFetch;
