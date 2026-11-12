# tiny-time-ago

A tiny (300b) relative time formatter (`3 minutes ago`) with live updates and `Intl.RelativeTimeFormat` support.

## Installation

Not yet published to npm. `npm install tiny-time-ago` returns 404 until the first release.

## Usage

```ts
import { timeAgo } from 'tiny-time-ago';

// Basic
timeAgo(Date.now() - 60000); // '1 minute ago'
timeAgo('2023-01-01');       // '1 year ago'

// Live updates
const cleanup = timeAgo.live(
  document.querySelector('#time'),
  Date.now(),
  { interval: 60000 } // Update every minute
);
```

## Options

### `timeAgo(date, options?)`

-   `date`: `Date` | `number` (timestamp) | `string`
-   `options.locale`: string (default: 'en')
-   `options.useIntl`: boolean (default: true)

## License

MIT
