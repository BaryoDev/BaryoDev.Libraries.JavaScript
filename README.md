# BaryoDev Libraries

> Ultra-lightweight JavaScript utility libraries, most with zero runtime dependencies

[![CI](https://github.com/BaryoDev/BaryoDev.Libraries.JavaScript/actions/workflows/ci.yml/badge.svg)](https://github.com/BaryoDev/BaryoDev.Libraries.JavaScript/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A collection of tiny, focused utility packages with **zero runtime dependencies**, except `mermaid-export`, which depends on `puppeteer` and downloads Chromium on install. Each package is designed to do one thing well.

## 📦 Packages

| Package                                           | Description                         | Size  |
| ------------------------------------------------- | ----------------------------------- | ----- |
| [nano-clsx](#nano-clsx)                           | Conditional className builder       | <300b |
| [nano-slug](#nano-slug)                           | URL-safe slug generator             | <400b |
| [nano-safe-storage](#nano-safe-storage)           | Fault-tolerant localStorage wrapper | <600b |
| [nano-human-bytes](#nano-human-bytes)             | Human-readable byte formatting      | <500b |
| [tiny-debounce-throttle](#tiny-debounce-throttle) | Debounce/throttle with cancel/flush | <600b |
| [tiny-time-ago](#tiny-time-ago)                   | Relative time formatting (not yet published to npm) | <500b |
| [click-outside-lite](#click-outside-lite)         | Click outside detection             | <400b |
| [deep-merge-lite](#deep-merge-lite)               | Deep merge with array strategies    | <700b |
| [deep-clean-obj](#deep-clean-obj)                 | Remove null/undefined from objects  | <500b |
| [resilient-fetcher](#resilient-fetcher)           | Fetch with retry/timeout            | <800b |
| [mermaid-export](#mermaid-export)                 | Export Mermaid diagrams (needs puppeteer) | n/a |
| [nano-form-sanitize](#nano-form-sanitize)         | Empty strings to null for forms (not yet published to npm) | n/a |

---

## Installation

Install any published package individually. `tiny-time-ago` and `nano-form-sanitize` are not on npm yet, so their install commands will not work until they are published.

```bash
npm install nano-clsx nano-slug nano-safe-storage
# or
pnpm add deep-merge-lite resilient-fetcher
```

---

## nano-clsx

Conditional className builder (alternative to `clsx`/`classnames`).

```ts
import { clsx } from 'nano-clsx';

clsx('foo', 'bar');                    // 'foo bar'
clsx({ active: true, hidden: false }); // 'active'
clsx(['a', { b: true }]);              // 'a b'
```

---

## nano-slug

URL-safe slug generator with custom replacements.

```ts
import { slugify } from 'nano-slug';

slugify('Hello World');         // 'hello-world'
slugify('Café Résumé');         // 'cafe-resume'
slugify('Rock & Roll');         // 'rock-and-roll'
slugify('Long Title', { maxLength: 10 }); // 'long-title'
```

---

## nano-safe-storage

Fault-tolerant localStorage with TTL and namespacing.

```ts
import { createStorage } from 'nano-safe-storage';

const storage = createStorage({ prefix: 'app_', ttl: 3600 });
storage.set('user', { name: 'John' });
storage.get('user'); // { name: 'John' }
storage.set('token', 'abc', { ttl: 900 }); // 15 min TTL
```

---

## nano-human-bytes

Human-readable byte formatting.

```ts
import { formatBytes, parseBytes } from 'nano-human-bytes';

formatBytes(1536);               // '1.5 KB'
formatBytes(1536, { bits: true }); // '12.29 Kb'
parseBytes('1.5 KB');            // 1536
```

---

## tiny-debounce-throttle

Debounce/throttle with cancel, flush, and RAF support.

```ts
import { debounce, throttle } from 'tiny-debounce-throttle';

const search = debounce(fetchResults, 300, { maxWait: 1000 });
search('query');
search.cancel();
search.flush();

const animate = throttle.raf(updatePosition);
```

---

## tiny-time-ago

Relative time formatting with locale support.

```ts
import { timeAgo, createTimeAgo } from 'tiny-time-ago';

timeAgo(Date.now() - 60000);     // '1 minute ago'
timeAgo(new Date('2024-12-23')); // '1 day ago'

const ago = createTimeAgo('es');
ago(new Date('2024-12-23'));     // 'hace 1 día'
```

---

## click-outside-lite

Detect clicks outside elements (modals, dropdowns).

```ts
import { onClickOutside } from 'click-outside-lite';

const cleanup = onClickOutside(modalRef, handleClose, {
  once: true,
  ignore: ['.tooltip']
});
```

---

## deep-merge-lite

Deep merge with array strategies and cloneDeep.

```ts
import { merge, cloneDeep } from 'deep-merge-lite';

merge({}, objA, objB);
merge({}, objA, objB, { arrayMerge: 'concat' });
const copy = cloneDeep(original);
```

---

## deep-clean-obj

Remove null, undefined, and empty values from objects.

```ts
import { clean } from 'deep-clean-obj';

clean({ a: 1, b: null, c: '' }); // { a: 1 }
clean(obj, { preserveEmptyArrays: true });
clean(obj, { exclude: ['meta.*'] });
```

---

## resilient-fetcher

Fetch wrapper with retry, timeout, and backoff.

```ts
import { resilientFetch } from 'resilient-fetcher';

const response = await resilientFetch('https://api.example.com', {
  retries: 3,
  timeout: 5000,
  backoff: 'exponential'
});
```

---

## mermaid-export

Export Mermaid diagrams to SVG or image formats. Unlike the other packages it has a runtime dependency: `puppeteer`, which downloads Chromium on install.

---

## nano-form-sanitize

Converts empty form strings to `null` before API submission. Not yet published to npm.

---

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build all packages
pnpm build

# Run benchmarks
pnpm bench
```

---

## License

MIT © [BaryoDev](https://github.com/BaryoDev)
