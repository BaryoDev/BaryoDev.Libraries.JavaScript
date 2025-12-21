import { describe, test, expect, vi, beforeEach } from 'vitest';
import { onClickOutside } from './index';

describe('onClickOutside', () => {
    let container: HTMLDivElement;
    let target: HTMLDivElement;
    let outside: HTMLDivElement;

    beforeEach(() => {
        document.body.innerHTML = '';
        container = document.createElement('div');
        target = document.createElement('div');
        target.id = 'target';
        outside = document.createElement('div');
        outside.id = 'outside';
        container.appendChild(target);
        container.appendChild(outside);
        document.body.appendChild(container);
    });

    test('fires callback when clicking outside', () => {
        const callback = vi.fn();
        onClickOutside(target, callback);

        outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        expect(callback).toHaveBeenCalledTimes(1);
    });

    test('does not fire when clicking inside', () => {
        const callback = vi.fn();
        onClickOutside(target, callback);

        target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        expect(callback).not.toHaveBeenCalled();
    });

    test('cleanup removes listeners', () => {
        const callback = vi.fn();
        const cleanup = onClickOutside(target, callback);

        cleanup();
        outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        expect(callback).not.toHaveBeenCalled();
    });

    test('once option auto-cleans up', () => {
        const callback = vi.fn();
        onClickOutside(target, callback, { once: true });

        outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        expect(callback).toHaveBeenCalledTimes(1);
    });

    test('selector string works', () => {
        const callback = vi.fn();
        onClickOutside('#target', callback);

        outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        expect(callback).toHaveBeenCalledTimes(1);
    });

    test('multiple elements', () => {
        const callback = vi.fn();
        const extra = document.createElement('div');
        extra.id = 'extra';
        container.appendChild(extra);

        onClickOutside([target, extra], callback);

        target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        expect(callback).not.toHaveBeenCalled();

        extra.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        expect(callback).not.toHaveBeenCalled();

        outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        expect(callback).toHaveBeenCalledTimes(1);
    });

    describe('edge cases', () => {
        test('handles detached elements (clicking detached target)', () => {
            const detached = document.createElement('div');
            const callback = vi.fn();
            onClickOutside(detached, callback);

            // Dispatch event on detached element
            detached.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

            // Should be considered "inside", so NO callback
            expect(callback).not.toHaveBeenCalled();
        });

        test('handles detached elements (clicking document)', () => {
            const detached = document.createElement('div');
            const callback = vi.fn();
            onClickOutside(detached, callback);

            // Click document
            document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

            // Detached element does not contain document, so "outside" -> callback fires
            expect(callback).toHaveBeenCalled();
        });

        test('handles "ignore" option', () => {
            const callback = vi.fn();
            const ignoredEl = document.createElement('div');
            ignoredEl.className = 'ignore-me';
            document.body.appendChild(ignoredEl);

            const target = document.createElement('div');
            document.body.appendChild(target);
            const outside = document.createElement('div');
            document.body.appendChild(outside);

            onClickOutside(target, callback, { ignore: ['.ignore-me'] });

            // Click ignored element
            ignoredEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            expect(callback).not.toHaveBeenCalled();

            // Click elsewhere
            outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            expect(callback).toHaveBeenCalled();
        });

        test('warns when no elements found', () => {
            const spy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            const callback = vi.fn();

            const cleanup = onClickOutside([], callback);
            expect(spy).toHaveBeenCalledWith('[click-outside-lite] No valid elements found');

            // cleanup shouldn't throw
            cleanup();
            spy.mockRestore();
        });

        test('supports custom events (focusin)', () => {
            const callback = vi.fn();
            const target = document.createElement('div');
            const outside = document.createElement('div');
            document.body.appendChild(target);
            document.body.appendChild(outside);

            onClickOutside(target, callback, { events: ['focusin'] });

            outside.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
            expect(callback).toHaveBeenCalled();
        });
    });
});
