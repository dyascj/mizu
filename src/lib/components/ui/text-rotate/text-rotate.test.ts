import { act, fireEvent, render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import TextRotate from './text-rotate.svelte';

function stubReducedMotion(reduce: boolean) {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: reduce && query.includes('reduce'),
		media: query,
		addEventListener() {},
		removeEventListener() {}
	}));
}

// jsdom has no Web Animations API; Svelte transitions finish on the next microtask.
const nativeAnimate = Element.prototype.animate;
const nativeGetAnimations = Element.prototype.getAnimations;
function fakeAnimate() {
	return {
		cancel() {},
		set onfinish(done: () => void) {
			queueMicrotask(done);
		}
	} as unknown as Animation;
}

const words = ['explore', 'build', 'ship'];
const current = (container: HTMLElement) => container.querySelector('.invisible')?.textContent;

beforeEach(() => {
	Element.prototype.animate = fakeAnimate;
	Element.prototype.getAnimations = () => [];
	stubReducedMotion(false);
	vi.useFakeTimers();
});

afterEach(() => {
	Element.prototype.animate = nativeAnimate;
	Element.prototype.getAnimations = nativeGetAnimations;
	vi.useRealTimers();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe('TextRotate', () => {
	test('shows the same final word to everyone under reduced motion', () => {
		stubReducedMotion(true);
		const { container } = render(TextRotate, { words, loop: false });
		expect(current(container)).toBe('ship');
		expect(container.querySelector('.sr-only')).toHaveTextContent('ship');
	});

	test('settles on the last word when it does not loop', async () => {
		const { container } = render(TextRotate, { words, interval: 1000, loop: false });
		expect(container.querySelector('.sr-only')).toHaveTextContent('ship');
		await act(() => vi.advanceTimersByTimeAsync(5000));
		expect(current(container)).toBe('ship');
		expect(vi.getTimerCount()).toBe(0);
	});

	test('gives assistive technology the first word and hides the rotation', () => {
		const { container } = render(TextRotate, { words });
		expect(container.querySelector('.sr-only')).toHaveTextContent('explore');
		for (const node of container.querySelectorAll('.sr-only ~ span')) {
			expect(node).toHaveAttribute('aria-hidden', 'true');
		}
	});

	test('cycles through the words on the interval and wraps around', async () => {
		const { container } = render(TextRotate, { words, interval: 1000 });
		expect(current(container)).toBe('explore');
		await act(() => vi.advanceTimersByTimeAsync(1000));
		expect(current(container)).toBe('build');
		await act(() => vi.advanceTimersByTimeAsync(2000));
		expect(current(container)).toBe('explore');
		expect(container.querySelector('.sr-only')).toHaveTextContent('explore');
	});

	test('holds the word while paused, hovered, focused, or in a background tab', async () => {
		const { container, rerender } = render(TextRotate, { words, interval: 1000, paused: true });
		const root = container.firstElementChild as HTMLElement;
		await act(() => vi.advanceTimersByTimeAsync(3000));
		expect(current(container)).toBe('explore');

		await rerender({ paused: false });
		await fireEvent.pointerEnter(root);
		await act(() => vi.advanceTimersByTimeAsync(3000));
		expect(current(container)).toBe('explore');
		await fireEvent.pointerLeave(root);

		await fireEvent.focusIn(root);
		await act(() => vi.advanceTimersByTimeAsync(3000));
		expect(current(container)).toBe('explore');
		await fireEvent.focusOut(root);

		vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
		await fireEvent(document, new Event('visibilitychange'));
		await act(() => vi.advanceTimersByTimeAsync(3000));
		expect(current(container)).toBe('explore');

		vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
		await fireEvent(document, new Event('visibilitychange'));
		await act(() => vi.advanceTimersByTimeAsync(1000));
		expect(current(container)).toBe('build');
	});

	test('never rotates for reduced motion', async () => {
		stubReducedMotion(true);
		const { container } = render(TextRotate, { words, interval: 1000 });
		expect(vi.getTimerCount()).toBe(0);
		await act(() => vi.advanceTimersByTimeAsync(5000));
		expect(current(container)).toBe('explore');
	});

	test('sizes the wrapper to the measured word and cleans up on destroy', async () => {
		const observers: { callback: ResizeObserverCallback; disconnect: () => void }[] = [];
		vi.stubGlobal(
			'ResizeObserver',
			class {
				disconnect = vi.fn();
				observe = vi.fn();
				constructor(callback: ResizeObserverCallback) {
					observers.push({ callback, disconnect: this.disconnect });
				}
			}
		);
		const { container, unmount } = render(TextRotate, { words });
		const root = container.firstElementChild as HTMLElement;
		expect(root.style.width).toBe('');

		observers[0].callback(
			[{ borderBoxSize: [{ inlineSize: 72.5 }] } as unknown as ResizeObserverEntry],
			{} as ResizeObserver
		);
		await act();
		expect(root.style.width).toBe('72.5px');

		expect(vi.getTimerCount()).toBe(1);
		unmount();
		expect(vi.getTimerCount()).toBe(0);
		expect(observers[0].disconnect).toHaveBeenCalled();
	});

	test('morph keeps the letters two words share and trades out the rest', async () => {
		// Hold every transition open until the test lets them finish.
		const pending: (() => void)[] = [];
		Element.prototype.animate = () =>
			({
				cancel() {},
				set onfinish(done: () => void) {
					pending.push(done);
				}
			}) as unknown as Animation;
		const { container } = render(TextRotate, {
			words: ['calm', 'clear', 'alive'],
			interval: 1000,
			effect: 'morph'
		});
		const box = () => container.querySelector<HTMLElement>('[data-word]');
		const letters = () => Array.from(box()?.querySelectorAll<HTMLElement>('[data-letter]') ?? []);

		expect(box()).toHaveAttribute('aria-hidden', 'true');
		expect(box()?.dataset.word).toBe('calm');
		const [c, a, l] = letters();

		await act(() => vi.advanceTimersByTimeAsync(1000));
		expect(box()?.dataset.word).toBe('clear');
		// "c" and "l" survive into "clear" in order; "a" and "m" trade out.
		const next = letters();
		expect(next.map((node) => node.textContent).join('')).toBe('clear');
		expect(next[0]).toBe(c);
		expect(next[1]).toBe(l);
		expect(next).not.toContain(a);
		// The leaving letters fade from where they stood, then are gone.
		const ghosts = () => container.querySelectorAll('[data-word] + span > span');
		expect(Array.from(ghosts(), (node) => node.textContent)).toEqual(['a', 'm']);
		// Each transition waits out its delay, then runs, so finish twice over.
		for (let round = 0; round < 3; round++)
			await act(() => pending.splice(0).forEach((done) => done()));
		expect(ghosts()).toHaveLength(0);
		expect(container.querySelector('.sr-only')).toHaveTextContent('calm');
	});

	test('morph never rotates for reduced motion', async () => {
		stubReducedMotion(true);
		const { container } = render(TextRotate, { words, interval: 1000, effect: 'morph' });
		await act(() => vi.advanceTimersByTimeAsync(5000));
		expect(container.querySelector('[data-word]')?.textContent).toBe('explore');
	});
});
