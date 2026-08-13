# nano-form-sanitize

Tiny form value sanitizer — converts empty strings to `null` before API submission.

HTML form fields produce empty strings (`""`) for blank inputs, but typed REST APIs (e.g., .NET `DateOnly?`, `int?`) reject them. This utility converts empty strings to `null` so nullable backend fields receive proper null values.

## Install

```bash
npm install nano-form-sanitize
```

## Usage

```ts
import { sanitize } from 'nano-form-sanitize';

// Basic: empty strings → null
sanitize({ name: 'Jo', dob: '' });
// => { name: 'Jo', dob: null }

// Trim whitespace
sanitize({ note: '  hi  ' }, { trim: true });
// => { note: 'hi' }

// Deep: recurse into nested objects
sanitize({ addr: { city: '', zip: '10001' } }, { deep: true });
// => { addr: { city: null, zip: '10001' } }

// Combine options
sanitize({ addr: { note: '  ' } }, { deep: true, trim: true });
// => { addr: { note: null } }
```

## API

### `sanitize<T>(values: T, options?: SanitizeOptions): T`

Returns a new object with string values sanitized according to options.

### `SanitizeOptions`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `emptyToNull` | `boolean` | `true` | Convert `""` to `null` |
| `trim` | `boolean` | `false` | Trim whitespace from strings |
| `deep` | `boolean` | `false` | Recurse into nested objects |

## License

MIT
