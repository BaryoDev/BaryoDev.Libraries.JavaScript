export interface ClickOutsideOptions {
    /** Auto-cleanup after first trigger (default: false) */
    once?: boolean;
    /** CSS selectors to ignore (clicks on these won't trigger callback) */
    ignore?: string[];
    /** Event types to listen for (default: ['mousedown', 'touchstart']) */
    events?: ('mousedown' | 'touchstart' | 'click' | 'focusin')[];
    /** Use capture phase (default: true) */
    capture?: boolean;
}

type ElementOrSelector = HTMLElement | string;

/**
 * Detects clicks outside of the specified element(s).
 * Returns a cleanup function to remove event listeners.
 *
 * @example
 * const cleanup = onClickOutside(modalRef, handleClose, { once: true });
 * // Later: cleanup();
 */
export function onClickOutside(
    target: ElementOrSelector | ElementOrSelector[],
    callback: (event: Event) => void,
    options: ClickOutsideOptions = {}
): () => void {
    const {
        once = false,
        ignore = [],
        events = ['mousedown', 'touchstart'],
        capture = true
    } = options;

    // Resolve elements
    const resolveElement = (el: ElementOrSelector): HTMLElement | null => {
        if (typeof el === 'string') {
            return document.querySelector(el);
        }
        return el;
    };

    const targets = Array.isArray(target) ? target : [target];
    const elements = targets.map(resolveElement).filter(Boolean) as HTMLElement[];

    if (elements.length === 0) {
        console.warn('[click-outside-lite] No valid elements found');
        return () => { };
    }

    let isActive = true;

    const listener = (event: Event) => {
        if (!isActive) return;

        const target = event.target as Node;

        // Check if click is inside any of the elements
        const isInside = elements.some(el => el.contains(target));
        if (isInside) return;

        // Check if click is on an ignored element
        if (ignore.length > 0) {
            const isIgnored = ignore.some(selector => {
                const ignored = document.querySelectorAll(selector);
                return Array.from(ignored).some(el => el.contains(target));
            });
            if (isIgnored) return;
        }

        callback(event);

        if (once) {
            cleanup();
        }
    };

    // Add listeners
    events.forEach(eventType => {
        document.addEventListener(eventType, listener, capture);
    });

    function cleanup() {
        isActive = false;
        events.forEach(eventType => {
            document.removeEventListener(eventType, listener, capture);
        });
    }

    return cleanup;
}

export default onClickOutside;
