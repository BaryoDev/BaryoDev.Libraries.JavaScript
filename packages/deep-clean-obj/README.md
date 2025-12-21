# deep-clean-obj

Recursively remove `null`, `undefined`, empty strings, and empty objects/arrays from an object.

## Installation

```bash
pnpm add deep-clean-obj
# or
npm install deep-clean-obj
```

## Usage

```ts
import { clean } from 'deep-clean-obj';

const dirty = {
  a: 1,
  b: null,
  c: undefined,
  d: '',
  e: {
    f: 'keep',
    g: null
  },
  h: []
};

const processed = clean(dirty);
// Output:
// {
//   a: 1,
//   e: {
//     f: 'keep'
//   }
// }
```

## Options

### `clean(obj, options?)`

-   **obj**: The object to clean.
-   **options**:
    -   `cleanNull` (boolean, default `true`): Remove `null` values.
    -   `cleanUndefined` (boolean, default `true`): Remove `undefined` values.
    -   `cleanEmptyStrings` (boolean, default `true`): Remove `""`.
    -   `cleanEmptyArrays` (boolean, default `true`): Remove `[]`.
    -   `cleanEmptyObjects` (boolean, default `true`): Remove `{}`.

## License

MIT
