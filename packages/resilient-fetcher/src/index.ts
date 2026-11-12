export interface ResilientOptions {
    /** Number of retry attempts (default: 3) */
    retries?: number;
    /** Delay between retries in ms (default: 1000) */
    retryDelay?: number;
    /** Request timeout in ms (default: 5000) */
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
class HttpStatusError extends Error {
    constructor(status: number) {
        super(`Request failed with status ${status}`);
        this.name = 'HttpStatusError';
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
    let finalUrl = url.toString();
    let finalOptions: RequestInit = fetchOptions;

    // Apply request interceptor
    if (onRequest) {
        finalOptions = await onRequest(finalUrl, fetchOptions);
    }

    const callerSignal = finalOptions.signal ?? undefined;

    while (true) {
        // Do not start an attempt after the caller aborted (also covers the backoff sleep)
        if (callerSignal?.aborted) {
            throw callerSignal.reason ?? new DOMException('This operation was aborted', 'AbortError');
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        const onCallerAbort = () => controller.abort();
        callerSignal?.addEventListener('abort', onCallerAbort, { once: true });

        try {
            const response = await fetch(finalUrl, {
                ...finalOptions,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                // Check if we should retry
                if (attempt < retries && retryOn(null, response)) {
                    attempt++;
                    const delay = calculateDelay(attempt, retryDelay, backoff);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                throw new HttpStatusError(response.status);
            }

            // Apply response interceptor
            if (onResponse) {
                return await onResponse(response);
            }

            return response;
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
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            throw err;
        } finally {
            callerSignal?.removeEventListener('abort', onCallerAbort);
        }
    }
}

export default resilientFetch;
