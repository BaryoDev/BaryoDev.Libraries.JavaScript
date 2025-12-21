# nano-clsx

A tiny, zero-dependency alternative to `classnames` or `clsx`.

## Installation

```bash
npm install nano-clsx
```

## Usage

```ts
import { clsx } from 'nano-clsx';

// Strings
clsx('foo', 'bar'); // => 'foo bar'

// Objects
clsx({ foo: true, bar: false }); // => 'foo'

// Arrays
clsx(['a', { b: true }]); // => 'a b'

// Mixed
clsx('base', condition && 'active', { hidden: !visible });
```

## License

MIT
