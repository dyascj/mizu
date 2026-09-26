import { act, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Fixture from './highlight-fixture.test.svelte';

function stubReducedMotion(reduce: boolean) {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: reduce && query.includes('reduce'),
		media: query,
		addEventListener() {},
		removeEventListener() {}
	}));
}

function stubObserver() {
	const observers: { callback: IntersectionObserverCallback; disconnect: () => void }[] = [];
	vi.stubGlobal(
		'IntersectionObserver',
		class {
			disconnect = vi.fn();
			observe = vi.fn();
			constructor(callback: IntersectionObserverCallback) {
				observers.push({ callback, disconnect: this.disconnect });
			}
		}
	);
	return observers;
}

/** Two line fragments, as if the phrase wrapped once. */
function wrapTwice() {
	vi.spyOn(HTMLElement.prototype, 'getClientRects').mockImplementation(function (
		this: HTMLElement
	) {
		if (this.tagName !== 'MARK') return [] as unknown as DOMRectList;
		return [
			DOMRect.fromRect({ x: 120, y: 0, width: 200, height: 24 }),
			DOMRect.fromRect({ x: 0, y: 24, width: 62, height: 24 })
		] as unknown as DOMRectList;
	});
}

beforeEach(() => {
	stubReducedMotion(false);
	vi.useFakeTimers();
	wrapTwice();
});

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
const mark = () => document.querySelector('mark') as HTMLElement;
const strokes = () => Array.from(document.querySelectorAll<HTMLElement>('.highlight-stroke'));

describe('Highlight', () => {
	test('marks the phrase in place and keeps the ink away from assistive technology', () => {
		stubObserver();
		render(Fixture);
		expect(mark()).toHaveTextContent('cut the monthly bill by a third');
		expect(screen.getByText(/The assistant found/)).toContainElement(mark());
		expect(mark().querySelector('[data-probe]')).toHaveAttribute('aria-hidden', 'true');
	});

	test('lays one stroke on each line, timed at an even pen speed', () => {
		stubObserver();
		render(Fixture);
		const [first, second] = strokes();
		expect(strokes()).toHaveLength(2);
		// Overshoots the words a little at both ends.
		expect(first.style.width).toBe('208px');
		const firstRun = parseFloat(first.style.getPropertyValue('--highlight-duration'));
		const secondRun = parseFloat(second.style.getPropertyValue('--highlight-duration'));
		expect(firstRun / secondRun).toBeCloseTo(208 / 70);
		// The second line starts where the first one ends.
		expect(parseFloat(second.style.getPropertyValue('--highlight-delay'))).toBeCloseTo(
			parseFloat(first.style.getPropertyValue('--highlight-delay')) + firstRun
		);
		expect(first.style.getPropertyValue('--highlight-ease')).toBe('var(--ease-in)');
		expect(second.style.getPropertyValue('--highlight-ease')).toBe('var(--ease-out)');
	});

	test('swipes once, when the phrase comes into view', async () => {
		const observers = stubObserver();
		render(Fixture);
		expect(mark()).not.toHaveAttribute('data-drawn');
		await advance(100);
		expect(mark()).not.toHaveAttribute('data-drawn');

		observers[0].callback(
			[{ isIntersecting: true } as IntersectionObserverEntry],
			{} as IntersectionObserver
		);
		await advance(50);
		expect(mark()).toHaveAttribute('data-drawn');
		expect(observers[0].disconnect).toHaveBeenCalled();
	});

	test('is simply marked for reduced motion or without an observer', async () => {
		stubReducedMotion(true);
		const observers = stubObserver();
		const reduced = render(Fixture);
		expect(mark()).toHaveAttribute('data-drawn');
		expect(mark()).toHaveAttribute('data-still');
		expect(observers).toHaveLength(0);
		reduced.unmount();

		stubReducedMotion(false);
		vi.stubGlobal('IntersectionObserver', undefined);
		render(Fixture);
		await advance(50);
		expect(mark()).toHaveAttribute('data-drawn');
	});

	test('reports the stroke as drawn once, including for reduced motion', async () => {
		stubObserver();
		stubReducedMotion(true);
		const onDrawn = vi.fn();
		const reduced = render(Fixture, { onDrawn });
		expect(onDrawn).toHaveBeenCalledTimes(1);
		reduced.unmount();

		// With motion, the last line's swipe ending reports it, once.
		stubReducedMotion(false);
		vi.stubGlobal('IntersectionObserver', undefined);
		const animated = vi.fn();
		render(Fixture, { onDrawn: animated });
		await advance(50);
		expect(animated).not.toHaveBeenCalled();
		const last = strokes().at(-1)!;
		last.dispatchEvent(new Event('transitionend'));
		last.dispatchEvent(new Event('transitionend'));
		expect(animated).toHaveBeenCalledTimes(1);
	});

	test('uses the chosen tone and cleans up its observer', () => {
		const observers = stubObserver();
		const { unmount } = render(Fixture, { tone: 'aurora' });
		expect(strokes()[0].firstElementChild).toHaveClass('aurora');
		unmount();
		expect(observers[0].disconnect).toHaveBeenCalled();
	});
});
