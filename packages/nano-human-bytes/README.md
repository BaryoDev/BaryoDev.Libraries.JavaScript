# nano-human-bytes

A tiny utility to format and parse byte values (e.g., `1024` -> `1 KB`).

## Installation

```bash
pnpm add nano-human-bytes
# or
npm install nano-human-bytes
```

## Usage

```ts
import { formatBytes, parseBytes } from 'nano-human-bytes';

// Format
formatBytes(1024); // '1 KB'
formatBytes(1536, { decimals: 2 }); // '1.50 KB'
formatBytes(1000, {bits: true}); // '8 Kb' (approx)

// Parse
parseBytes('1 KB'); // 1024
parseBytes('1.5 MB'); // 1572864
```

## API

### `formatBytes(bytes, options?)`

-   `decimals`: number (default: 2)
-   `bits`: boolean (default: false) - output bits
-   `unitDisplay`: 'short' | 'long' (default: 'short')
-   `space`: boolean (default: true)
-   `locale`: string (optional)

### `parseBytes(string)`

Returns `number` or `null` if invalid.

## License

MIT
