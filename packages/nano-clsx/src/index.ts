/**
 * Value types that clsx accepts
 */
export type ClassValue =
    | string
    | number
    | boolean
    | null
    | undefined
    | ClassValue[]
    | { [key: string]: unknown };

/**
 * Recursively processes a value and builds a className string.
 */
function toVal(mix: ClassValue): string {
    let str = '';

    if (typeof mix === 'string' || typeof mix === 'number') {
        str += mix;
    } else if (typeof mix === 'object' && mix !== null) {
        if (Array.isArray(mix)) {
            for (let i = 0; i < mix.length; i++) {
                const val = mix[i];
                if (val) {
                    const y = toVal(val);
                    if (y) {
                        if (str) str += ' ';
                        str += y;
                    }
                }
            }
        } else {
            for (const key in mix) {
                if (Object.prototype.hasOwnProperty.call(mix, key) && mix[key]) {
                    if (str) str += ' ';
                    str += key;
                }
            }
        }
    }

    return str;
}

/**
 * Constructs className strings conditionally.
 * Accepts strings, numbers, objects, and arrays (recursively).
 *
 * @example
 * clsx('foo', 'bar'); // => 'foo bar'
 * clsx({ foo: true, bar: false }); // => 'foo'
 * clsx(['a', ['b', { c: true }]]); // => 'a b c'
 */
export function clsx(...args: ClassValue[]): string {
    return toVal(args);
}

export default clsx;
