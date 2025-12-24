export interface StorageOptions {
    /** Key prefix for namespacing (default: '') */
    prefix?: string;
    /** Default TTL in seconds (optional) */
    ttl?: number;
}

export interface SetOptions {
    /** TTL for this specific item in seconds */
    ttl?: number;
}

interface StoredValue<T> {
    value: T;
    expiry?: number;
}

// In-memory fallback store
const memoryStore: Record<string, string> = {};

const memoryFallback = {
    getItem: (key: string): string | null => memoryStore[key] ?? null,
    setItem: (key: string, value: string): void => {
        memoryStore[key] = value;
    },
    removeItem: (key: string): void => {
        delete memoryStore[key];
    },
    clear: (): void => {
        for (const key in memoryStore) delete memoryStore[key];
    }
};

// Detect available storage
function getStorage(): Storage | typeof memoryFallback {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const testKey = '__nano_safe_test__';
            window.localStorage.setItem(testKey, testKey);
            window.localStorage.removeItem(testKey);
            return window.localStorage;
        }
    } catch {
        // localStorage unavailable (Safari Private Mode, etc.)
    }
    return memoryFallback;
}

const storage = getStorage();

/**
 * Creates a namespaced storage instance with optional TTL support.
 */
export function createStorage(options: StorageOptions = {}) {
    const { prefix = '', ttl: defaultTtl } = options;

    const prefixKey = (key: string) => `${prefix}${key}`;

    return {
        /**
         * Sets a value in storage with optional TTL.
         */
        set<T>(key: string, value: T, setOptions?: SetOptions): void {
            try {
                const ttl = setOptions?.ttl ?? defaultTtl;
                const stored: StoredValue<T> = {
                    value,
                    expiry: ttl ? Date.now() + ttl * 1000 : undefined
                };
                storage.setItem(prefixKey(key), JSON.stringify(stored));
            } catch (err) {
                console.warn(`nano-safe-storage: set failed for key "${key}"`, err);
            }
        },

        /**
         * Gets a value from storage. Returns null if expired or not found.
         */
        get<T>(key: string): T | null {
            try {
                const raw = storage.getItem(prefixKey(key));
                if (raw === null) return null;

                const stored: StoredValue<T> = JSON.parse(raw);

                // Check expiry
                if (stored.expiry && Date.now() > stored.expiry) {
                    this.remove(key);
                    return null;
                }

                return stored.value;
            } catch {
                return null;
            }
        },

        /**
         * Removes an item from storage.
         */
        remove(key: string): void {
            try {
                storage.removeItem(prefixKey(key));
            } catch (err) {
                console.warn(`nano-safe-storage: remove failed for key "${key}"`, err);
            }
        },

        /**
         * Checks if a key exists and is not expired.
         */
        has(key: string): boolean {
            return this.get(key) !== null;
        },

        /**
         * Clears all items with the current prefix.
         */
        clear(): void {
            try {
                if (prefix && typeof window !== 'undefined' && window.localStorage) {
                    const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
                    keys.forEach(k => localStorage.removeItem(k));
                } else {
                    storage.clear();
                }
            } catch (err) {
                console.warn('nano-safe-storage: clear failed', err);
            }
        },

        /**
         * Checks if storage is available (not using memory fallback).
         */
        isAvailable(): boolean {
            return storage !== memoryFallback;
        }
    };
}

// Default instance without prefix
const defaultStorage = createStorage();

export const { set: setItem, get: getItem, remove: removeItem, has, clear } = {
    set: defaultStorage.set.bind(defaultStorage),
    get: defaultStorage.get.bind(defaultStorage),
    remove: defaultStorage.remove.bind(defaultStorage),
    has: defaultStorage.has.bind(defaultStorage),
    clear: defaultStorage.clear.bind(defaultStorage)
};

export default createStorage;
