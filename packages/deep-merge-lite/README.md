# deep-merge-lite

A lightweight, zero-dependency deep merge utility with array strategies and TypeScript support.

## Installation

```bash
pnpm add deep-merge-lite
# or
npm install deep-merge-lite
```

## Usage

```ts
import { merge } from 'deep-merge-lite';

const obj1 = { a: 1, b: { c: 2 }, d: [1] };
const obj2 = { b: { e: 3 }, d: [2] };

const result = merge(obj1, obj2);
// Output:
// {
//   a: 1,
//   b: { c: 2, e: 3 },
//   d: [1, 2] // Default array strategy: concat
// }
```

## Options

### `merge(target, ...sources)`

Supports passing an options object as the last argument (or as part of sources if typed loosely).

-   `arrayStrategy`: 'concat' | 'replace' | 'union' (default: 'concat')

```ts
merge(obj1, obj2, { arrayStrategy: 'replace' });
// d: [2]
```

## License

MIT
