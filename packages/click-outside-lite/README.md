# click-outside-lite

A lightweight (500b), zero-dependency React hook to detect clicks outside a component.

## Installation

```bash
pnpm add click-outside-lite
# or
npm install click-outside-lite
```

## Usage

```tsx
import { useState, useRef } from 'react';
import { useClickOutside } from 'click-outside-lite';

function Modal() {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => {
    setIsOpen(false);
  });

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>
      {isOpen && (
        <div ref={ref} className="modal">
          <h1>Modal Title</h1>
          <p>Click outside to close me</p>
        </div>
      )}
    </>
  );
}
```

## API

### `useClickOutside(ref, handler, events?)`

-   **ref**: `React.RefObject<T>` - The ref of the element to detect clicks outside of.
-   **handler**: `(event: Event) => void` - Function to call when a click outside occurs.
-   **events**: `string[]` (optional) - List of events to listen for. Defaults to `['mousedown', 'touchstart']`.

## License

MIT
