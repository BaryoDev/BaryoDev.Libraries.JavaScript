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

/** Lists every key in a store, for both localStorage and the memory fallback. */
function listKeys(store: Storage | typeof memoryFallback): string[] {
    if (store === memoryFallback) return Object.keys(memoryStore);
    const out: string[] = [];
    for (let i = 0; i < (store as Storage).length; i++) {
        const key = (store as Storage).key(i);
        if (key !== null) out.push(key);
    }
    return out;
}

/**
 * Creates a namespaced storage instance with optional TTL support.
 * Methods do not use `this`, so they can be destructured.
 */
export function createStorage(options: StorageOptions = {}) {
    const { prefix = '', ttl: defaultTtl } = options;

    const prefixKey = (key: string) => `${prefix}${key}`;

    /**
     * Removes an item from storage.
     */
    function remove(key: string): void {
        try {
            storage.removeItem(prefixKey(key));
        } catch (err) {
            console.warn(`nano-safe-storage: remove failed for key "${key}"`, err);
        }
    }

    /**
     * Sets a value in storage with optional TTL.
     */
    function set<T>(key: string, value: T, setOptions?: SetOptions): void {
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
    }

    /**
     * Gets a value from storage. Returns null if expired or not found.
     */
    function get<T>(key: string): T | null {
        try {
            const raw = storage.getItem(prefixKey(key));
            if (raw === null) return null;

            const stored: StoredValue<T> = JSON.parse(raw);

            // Check expiry
            if (stored.expiry && Date.now() > stored.expiry) {
                remove(key);
                return null;
            }

            return stored.value;
        } catch {
            return null;
        }
    }

    /**
     * Checks if a key exists and is not expired.
     */
    function has(key: string): boolean {
        return get(key) !== null;
    }

    /**
     * Clears the items whose key starts with this instance's prefix, in
     * localStorage or the memory fallback, whichever is in use.
     *
     * With no prefix there is nothing to tell this library's keys from any
     * other, so it clears the whole store (the whole origin in a browser).
     */
    function clear(): void {
        try {
            if (prefix) {
                listKeys(storage)
                    .filter(k => k.startsWith(prefix))
                    .forEach(k => storage.removeItem(k));
            } else {
                storage.clear();
            }
        } catch (err) {
            console.warn('nano-safe-storage: clear failed', err);
        }
    }

    /**
     * Checks if storage is available (not using memory fallback).
     */
    function isAvailable(): boolean {
        return storage !== memoryFallback;
    }

    return { set, get, remove, has, clear, isAvailable };
}

// Default instance without prefix
const defaultStorage = createStorage();

export const {
    set: setItem,
    get: getItem,
    remove: removeItem,
    has,
    clear
} = defaultStorage;

export default createStorage;
