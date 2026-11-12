import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { resilientFetch, HttpStatusError } from './index';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('resilientFetch', () => {
    beforeEach(() => {
        mockFetch.mockReset();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test('returns successful response', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200
        });

        const response = await resilientFetch('https://example.com');
        expect(response.status).toBe(200);
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('retries on failure then succeeds', async () => {
        mockFetch
            .mockRejectedValueOnce(new Error('Network Error'))
            .mockResolvedValueOnce({ ok: true, status: 200 });

        const promise = resilientFetch('https://example.com', {
            retries: 2,
            retryDelay: 100
        });

        await vi.advanceTimersByTimeAsync(100);
        const response = await promise;

        expect(response.status).toBe(200);
        expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test('throws after exhausting retries', async () => {
        mockFetch.mockRejectedValue(new Error('Persistent Error'));

        const promise = resilientFetch('https://example.com', {
            retries: 2,
            retryDelay: 100
        }).catch(e => e);

        await vi.advanceTimersByTimeAsync(100);
        await vi.advanceTimersByTimeAsync(100);

        const error = await promise;
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Persistent Error');
        expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    test('retries on 5xx by default', async () => {
        mockFetch
            .mockResolvedValueOnce({ ok: false, status: 500 })
            .mockResolvedValueOnce({ ok: true, status: 200 });

        const promise = resilientFetch('https://example.com', {
            retries: 2,
            retryDelay: 50
        });

        await vi.advanceTimersByTimeAsync(50);
        const response = await promise;

        expect(response.status).toBe(200);
        expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test('does not retry on 4xx by default', async () => {
        mockFetch.mockResolvedValue({ ok: false, status: 404 });

        const promise = resilientFetch('https://example.com', {
            retries: 2,
            timeout: 5000,
            retryDelay: 100
        });

        await expect(promise).rejects.toThrow('Request failed with status 404');
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('retries 5xx up to the retry limit then throws', async () => {
        mockFetch.mockResolvedValue({ ok: false, status: 503 });

        const promise = resilientFetch('https://example.com', {
            retries: 2,
            retryDelay: 50
        }).catch(e => e);

        await vi.advanceTimersByTimeAsync(50);
        await vi.advanceTimersByTimeAsync(50);

        const error = await promise;
        expect(error.message).toBe('Request failed with status 503');
        expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    test('custom retryOn condition', async () => {
        mockFetch
            .mockResolvedValueOnce({ ok: false, status: 429 })
            .mockResolvedValueOnce({ ok: true, status: 200 });

        const promise = resilientFetch('https://example.com', {
            retries: 2,
            retryDelay: 50,
            retryOn: (_error, response) => response?.status === 429
        });

        await vi.advanceTimersByTimeAsync(50);
        const response = await promise;

        expect(response.status).toBe(200);
    });

    test('onRequest interceptor', async () => {
        mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

        await resilientFetch('https://example.com', {
            onRequest: (_url, options) => ({
                ...options,
                headers: { Authorization: 'Bearer token' }
            })
        });

        expect(mockFetch).toHaveBeenCalledWith(
            'https://example.com',
            expect.objectContaining({
                headers: { Authorization: 'Bearer token' }
            })
        );
    });

    test('onError callback is called', async () => {
        const onError = vi.fn();
        mockFetch.mockRejectedValue(new Error('Network Error'));

        await resilientFetch('https://example.com', {
            retries: 0,
            onError
        }).catch(() => { });

        expect(onError).toHaveBeenCalled();
    });

    describe('edge cases', () => {
        test('passes signal to fetch', async () => {
            mockFetch.mockResolvedValue({ ok: true, status: 200 });
            await resilientFetch('https://example.com');
            const call = mockFetch.mock.calls[0];
            expect(call[1].signal).toBeDefined();
            expect(call[1].signal).toBeInstanceOf(AbortSignal);
        });

        test('caller abort stops the request and is not retried', async () => {
            mockFetch.mockImplementation((_url, options) => {
                return new Promise((_resolve, reject) => {
                    options.signal.addEventListener('abort', () => {
                        const err = new Error('Aborted');
                        err.name = 'AbortError';
                        reject(err);
                    });
                });
            });

            const caller = new AbortController();
            const promise = resilientFetch('https://example.com', {
                retries: 3,
                retryDelay: 50,
                signal: caller.signal
            }).catch(e => e);

            caller.abort();
            await vi.advanceTimersByTimeAsync(500);

            const error = await promise;
            expect(error.name).toBe('AbortError');
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        test('already aborted caller signal makes no fetch call', async () => {
            const caller = new AbortController();
            caller.abort();

            await expect(
                resilientFetch('https://example.com', { signal: caller.signal })
            ).rejects.toMatchObject({ name: 'AbortError' });
            expect(mockFetch).not.toHaveBeenCalled();
        });

        test('aborts on timeout', async () => {
            vi.useRealTimers();
            mockFetch.mockImplementation((_url, options) => {
                return new Promise((_resolve, reject) => {
                    const signal = options?.signal;
                    if (signal) {
                        if (signal.aborted) {
                            const err = new Error('Aborted');
                            err.name = 'AbortError';
                            reject(err);
                        } else {
                            signal.addEventListener('abort', () => {
                                const err = new Error('Aborted');
                                err.name = 'AbortError';
                                reject(err);
                            });
                        }
                    }
                });
            });

            const promise = resilientFetch('https://example.com', {
                timeout: 100,
                retries: 0
            });

            // Wait sufficiently for timeout (100ms + buffer)
            // No need to advance timers since we switched to Real Timers

            await expect(promise).rejects.toThrow('Request timed out');
        });
    });

    describe('fixes', () => {
        test('does not retry an error thrown by onResponse', async () => {
            mockFetch.mockResolvedValue({ ok: true, status: 200 });
            const onResponse = vi.fn().mockRejectedValue(new Error('bad body'));
            const onError = vi.fn();

            await expect(
                resilientFetch('https://example.com', { retries: 3, retryDelay: 10, onResponse, onError })
            ).rejects.toThrow('bad body');

            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(onResponse).toHaveBeenCalledTimes(1);
            expect(onError).toHaveBeenCalledTimes(1);
        });

        test('accepts a Request without stringifying it', async () => {
            mockFetch.mockResolvedValue({ ok: true, status: 200 });
            const req = new Request('https://example.com/api', {
                method: 'POST',
                body: 'payload',
                headers: { 'x-test': '1' }
            });

            await resilientFetch(req);

            const [input] = mockFetch.mock.calls[0];
            expect(input).toBeInstanceOf(Request);
            expect(input.url).toBe('https://example.com/api');
            expect(input.method).toBe('POST');
            expect(input.headers.get('x-test')).toBe('1');
            expect(await input.text()).toBe('payload');
        });

        test('sends a Request body again on retry', async () => {
            mockFetch
                .mockRejectedValueOnce(new Error('Network Error'))
                .mockResolvedValueOnce({ ok: true, status: 200 });
            const req = new Request('https://example.com/api', { method: 'POST', body: 'payload' });

            const promise = resilientFetch(req, { retries: 1, retryDelay: 10 });
            await vi.advanceTimersByTimeAsync(10);
            await promise;

            expect(mockFetch).toHaveBeenCalledTimes(2);
            expect(await mockFetch.mock.calls[1][0].text()).toBe('payload');
        });

        test('a caller abort during backoff rejects at once', async () => {
            mockFetch.mockRejectedValue(new Error('Network Error'));
            const ac = new AbortController();

            const promise = resilientFetch('https://example.com', {
                retries: 3,
                retryDelay: 5000,
                signal: ac.signal
            });
            const settled = promise.then(() => 'ok', (e) => e);

            await vi.advanceTimersByTimeAsync(100);
            ac.abort();
            await vi.advanceTimersByTimeAsync(0);

            const result = await settled;
            expect((result as Error).name).toBe('AbortError');
            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(vi.getTimerCount()).toBe(0);
        });

        test('a caller abort during backoff after a 5xx rejects at once', async () => {
            mockFetch.mockResolvedValue({ ok: false, status: 503 });
            const ac = new AbortController();

            const promise = resilientFetch('https://example.com', {
                retries: 3,
                retryDelay: 5000,
                signal: ac.signal
            });
            const settled = promise.then(() => 'ok', (e) => e);

            await vi.advanceTimersByTimeAsync(100);
            ac.abort();
            await vi.advanceTimersByTimeAsync(0);

            expect(((await settled) as Error).name).toBe('AbortError');
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        test.each([Infinity, 0, 2 ** 31])('timeout %s means no timeout', async (timeout) => {
            let signal: AbortSignal | undefined;
            mockFetch.mockImplementation(async (_u: unknown, init?: RequestInit) => {
                signal = init?.signal ?? undefined;
                await new Promise(r => setTimeout(r, 10000));
                return { ok: true, status: 200 };
            });

            const promise = resilientFetch('https://example.com', { timeout, retries: 0 });
            await vi.advanceTimersByTimeAsync(10000);
            const response = await promise;

            expect(response.status).toBe(200);
            expect(signal?.aborted).toBe(false);
        });

        test('HttpStatusError carries status and response', async () => {
            const res = { ok: false, status: 404 };
            mockFetch.mockResolvedValue(res);

            const err = await resilientFetch('https://example.com', { retries: 0 }).catch(e => e);

            expect(err).toBeInstanceOf(HttpStatusError);
            expect(err.status).toBe(404);
            expect(err.response).toBe(res);
        });

        test('cancels the body of a non-ok response before retrying', async () => {
            const cancel = vi.fn().mockResolvedValue(undefined);
            mockFetch
                .mockResolvedValueOnce({ ok: false, status: 503, body: { cancel } })
                .mockResolvedValueOnce({ ok: true, status: 200 });

            const promise = resilientFetch('https://example.com', { retries: 1, retryDelay: 10 });
            await vi.advanceTimersByTimeAsync(10);
            await promise;

            expect(cancel).toHaveBeenCalledTimes(1);
        });

        test('keeps the body of the final non-ok response readable', async () => {
            const cancel = vi.fn();
            mockFetch.mockResolvedValue({ ok: false, status: 500, body: { cancel } });

            await expect(resilientFetch('https://example.com', { retries: 0 })).rejects.toThrow('status 500');

            expect(cancel).not.toHaveBeenCalled();
        });
    });
});
