# tiny-debounce-throttle

Micro-sized (< 300b) implementations of `debounce` and `throttle` with cancellation and flushing.

## Installation

```bash
pnpm add tiny-debounce-throttle
# or
npm install tiny-debounce-throttle
```

## Usage

```ts
import { debounce, throttle } from 'tiny-debounce-throttle';

// Debounce
const save = debounce((text) => api.save(text), 1000);
save('draft');
save.cancel(); // Cancel pending
save.flush();  // Execute immediately

// Throttle
const log = throttle((pos) => console.log(pos), 100);
window.addEventListener('scroll', () => log(window.scrollY));
```

## API

### `debounce(func, wait, options?)`

-   `options.leading`: boolean (default: false)
-   `options.trailing`: boolean (default: true)
-   `options.maxWait`: number

### `throttle(func, wait)`

-   Guarantees execution every `wait` ms.
-   Includes `throttle.raf(func)` for `requestAnimationFrame` throttling.

## License

MIT
