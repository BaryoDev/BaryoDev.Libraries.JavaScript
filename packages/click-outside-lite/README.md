# click-outside-lite

A lightweight (500b), zero-dependency helper to detect clicks outside an element.

## Installation

```bash
pnpm add click-outside-lite
# or
npm install click-outside-lite
```

## Usage

```ts
import { onClickOutside } from 'click-outside-lite';

const modal = document.querySelector('.modal') as HTMLElement;

const cleanup = onClickOutside(modal, () => {
  modal.remove();
}, { once: true });

// Later, to stop listening early:
cleanup();
```

With React, call it from an effect and return the cleanup:

```tsx
import { useEffect, useRef } from 'react';
import { onClickOutside } from 'click-outside-lite';

function Modal({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    return onClickOutside(ref.current, onClose);
  }, [onClose]);

  return <div ref={ref} className="modal">Click outside to close me</div>;
}
```

## API

### `onClickOutside(target, callback, options?)`

Returns a cleanup function that removes the listeners.

-   **target**: `HTMLElement | string | (HTMLElement | string)[]` - The element(s), or CSS selectors, to watch. A click inside any of them is not "outside".
-   **callback**: `(event: Event) => void` - Called when a click outside occurs.
-   **options.once**: `boolean` - Remove the listeners after the first trigger. Default `false`.
-   **options.ignore**: `string[]` - CSS selectors whose elements do not trigger the callback.
-   **options.events**: `('mousedown' | 'touchstart' | 'click' | 'focusin')[]` - Events to listen for. Default `['mousedown', 'touchstart']`.
-   **options.capture**: `boolean` - Use the capture phase. Default `true`.

There is no React dependency and no hook export. The default export is `onClickOutside`.

## License

MIT
