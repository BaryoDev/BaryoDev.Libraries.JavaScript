import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createStorage, setItem, getItem, removeItem, has, clear } from './index';

describe('nano-safe-storage', () => {
    beforeEach(() => {
        clear();
    });

    describe('default instance', () => {
        test('setItem and getItem', () => {
            setItem('test', { foo: 'bar' });
            expect(getItem('test')).toEqual({ foo: 'bar' });
        });

        test('removeItem', () => {
            setItem('key', 'value');
            expect(has('key')).toBe(true);
            removeItem('key');
            expect(has('key')).toBe(false);
        });

        test('returns null for non-existent keys', () => {
            expect(getItem('nonexistent')).toBeNull();
        });
    });

    describe('createStorage', () => {
        test('prefix namespacing', () => {
            const app1 = createStorage({ prefix: 'app1_' });
            const app2 = createStorage({ prefix: 'app2_' });

            app1.set('user', 'alice');
            app2.set('user', 'bob');

            expect(app1.get('user')).toBe('alice');
            expect(app2.get('user')).toBe('bob');
        });

        test('TTL expiration', async () => {
            const storage = createStorage({ ttl: 1 }); // 1 second default

            storage.set('temp', 'data');
            expect(storage.get('temp')).toBe('data');

            // Wait for expiry
            await new Promise(r => setTimeout(r, 1100));
            expect(storage.get('temp')).toBeNull();
        });

        test('per-item TTL override', async () => {
            const storage = createStorage({ ttl: 10 }); // 10 second default

            storage.set('quick', 'data', { ttl: 1 }); // Override to 1 second
            expect(storage.get('quick')).toBe('data');

            await new Promise(r => setTimeout(r, 1100));
            expect(storage.get('quick')).toBeNull();
        });

        test('has method', () => {
            const storage = createStorage();
            expect(storage.has('missing')).toBe(false);
            storage.set('exists', true);
            expect(storage.has('exists')).toBe(true);
        });
    });

    describe('edge cases', () => {
        test('handles invalid JSON in storage', () => {
            const storage = createStorage({ prefix: 'edge_' });
            // Manually corrupt data using direct localStorage access if available
            // Note: In JSDOM, localStorage is available.
            const rawKey = 'edge_corrupt';
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(rawKey, '{ invalid json }');
                expect(storage.get('corrupt')).toBeNull();
            }
        });

        test('handles quota exceeded (setItem throws)', () => {
            const storage = createStorage({ prefix: 'quota_' });
            const spy = vi.spyOn(console, 'warn').mockImplementation(() => { });

            if (typeof localStorage !== 'undefined') {
                const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
                    throw new Error('QuotaExceededError');
                });

                storage.set('key', 'value');
                expect(spy).toHaveBeenCalled();

                setItemSpy.mockRestore();
            }
            spy.mockRestore();
        });
    });

    describe('destructuring and clear', () => {
        test('methods work when destructured', () => {
            const { set, get, has, remove, clear: clearAll } = createStorage({ prefix: 'd_' });
            set('k', 1);
            expect(get('k')).toBe(1);
            expect(has('k')).toBe(true);
            remove('k');
            expect(has('k')).toBe(false);
            expect(() => clearAll()).not.toThrow();
        });

        test('an expired item is removed by a destructured get', () => {
            const { set, get } = createStorage({ prefix: 'e_' });
            const now = Date.now();
            const spy = vi.spyOn(Date, 'now').mockReturnValue(now);
            set('k', 1, { ttl: 1 });
            spy.mockReturnValue(now + 2000);
            expect(get('k')).toBeNull();
            expect(localStorage.getItem('e_k')).toBeNull();
            spy.mockRestore();
        });

        test('clear with a prefix leaves other keys alone', () => {
            localStorage.setItem('other_lib', 'keep');
            const a = createStorage({ prefix: 'a_' });
            const b = createStorage({ prefix: 'b_' });
            a.set('x', 1);
            b.set('x', 2);

            a.clear();

            expect(a.get('x')).toBeNull();
            expect(b.get('x')).toBe(2);
            expect(localStorage.getItem('other_lib')).toBe('keep');
        });

        test('clear without a prefix clears the whole store', () => {
            localStorage.setItem('other_lib', 'gone');
            createStorage().clear();
            expect(localStorage.getItem('other_lib')).toBeNull();
        });

        test('clear with a prefix leaves other namespaces alone in the memory fallback', async () => {
            const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
                throw new Error('unavailable');
            });
            vi.resetModules();
            const mod = await import('./index');
            setItemSpy.mockRestore();

            expect(mod.createStorage().isAvailable()).toBe(false);
            const a = mod.createStorage({ prefix: 'a_' });
            const b = mod.createStorage({ prefix: 'b_' });
            a.set('x', 1);
            b.set('x', 2);

            a.clear();

            expect(a.get('x')).toBeNull();
            expect(b.get('x')).toBe(2);
        });
    });
});
