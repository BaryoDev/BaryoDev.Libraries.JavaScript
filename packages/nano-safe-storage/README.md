# nano-safe-storage

A safe wrapper around `localStorage` with TTL (Time To Live), quota management, and memory fallback.

## Installation

```bash
pnpm add nano-safe-storage
# or
npm install nano-safe-storage
```

## Usage

```ts
import { createStorage } from 'nano-safe-storage';

const storage = createStorage({
    prefix: 'myapp_',
    ttl: 3600 // default TTL in seconds (1 hour)
});

// Set with optional override TTL
storage.set('user', { name: 'Alice' }, { ttl: 60 }); // 60 seconds

// Get (returns null if expired or missing)
const user = storage.get('user');

// Check existence
if (storage.has('user')) { ... }

// Remove
storage.remove('user');
```

## Features

-   **Prefix Isolation**: The `prefix` option is added to the front of every key. It is joined as is, so include your own separator (`myapp_`).
-   **TTL Support**: Auto-expiration of data. TTL values are in seconds.
-   **Memory Fallback**: Works in private mode or non-browser environments (like SSR) without crashing.
-   **Safe JSON**: Handles JSON parsing errors gracefully.

## Clearing

`clear()` removes only the keys that start with the instance's `prefix`. With no `prefix` the library cannot tell its keys from anyone else's, so `clear()` clears the whole storage (the whole origin's `localStorage` in a browser, the whole memory store in the fallback). Give your instance a `prefix` if other code shares the origin.

Methods do not depend on `this`, so `const { get, set } = createStorage()` works.

## License

MIT
