import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import BackToTop from './back-to-top.svelte';

// jsdom has no Web Animations API; Svelte transitions finish on the next microtask.
const nativeAnimate = Element.prototype.animate;
function fakeAnimate() {
	return {
		cancel() {},
		set onfinish(done: () => void) {
			queueMicrotask(done);
		}
	} as unknown as Animation;
}

beforeEach(() => {
	vi.useFakeTimers();
	Element.prototype.animate = fakeAnimate;
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
	Element.prototype.animate = nativeAnimate;
	document.body.innerHTML = '';
});

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

/** A 1000px tall scroller showing 200px at a time, so 800px of travel. */
function scroller() {
	const el = document.createElement('div');
	el.tabIndex = 0;
	Object.defineProperty(el, 'scrollHeight', { value: 1000 });
	Object.defineProperty(el, 'clientHeight', { value: 200 });
	el.scrollTo = ((options: ScrollToOptions) => {
		el.scrollTop = options.top ?? 0;
		el.dispatchEvent(new Event('scroll'));
	}) as typeof el.scrollTo;
	document.body.append(el);
	return el;
}

async function scrollTo(el: HTMLElement, top: number) {
	el.scrollTop = top;
	await fireEvent.scroll(el);
	await advance(20);
}

const ring = (button: HTMLElement) =>
	Number(button.querySelectorAll('circle')[1].style.getPropertyValue('stroke-dashoffset'));

describe('BackToTop', () => {
	test('stays hidden near the top and offers itself once the reader is past the threshold', async () => {
		const target = scroller();
		render(BackToTop, { props: { target } });
		expect(screen.queryByRole('button')).toBeNull();

		await scrollTo(target, 80);
		expect(screen.queryByRole('button')).toBeNull();

		await scrollTo(target, 400);
		const button = screen.getByRole('button', { name: 'Back to top' });
		expect(ring(button)).toBeCloseTo(0.5);

		await scrollTo(target, 600);
		expect(ring(button)).toBeCloseTo(0.25);
	});

	test('glides back up, then hides and hands focus to the scroller', async () => {
		const target = scroller();
		const onArrive = vi.fn();
		render(BackToTop, { props: { target, onArrive } });
		await scrollTo(target, 600);
		const button = screen.getByRole('button', { name: 'Back to top' });
		button.focus();

		await fireEvent.click(button);
		await advance(200);
		expect(target.scrollTop).toBeGreaterThan(0);
		expect(target.scrollTop).toBeLessThan(600);
		// The button stays to show the ring draining.
		expect(screen.getByRole('button', { name: 'Back to top' })).toBeInTheDocument();

		await advance(1200);
		expect(target.scrollTop).toBe(0);
		expect(onArrive).toHaveBeenCalledTimes(1);
		expect(screen.queryByRole('button')).toBeNull();
		expect(document.activeElement).toBe(target);
	});

	test('hands control back when the reader scrolls on the way up', async () => {
		const target = scroller();
		render(BackToTop, { props: { target } });
		await scrollTo(target, 600);
		await fireEvent.click(screen.getByRole('button', { name: 'Back to top' }));
		await advance(150);
		const stoppedAt = target.scrollTop;
		expect(stoppedAt).toBeGreaterThan(0);

		await fireEvent.wheel(target);
		await advance(1500);
		expect(target.scrollTop).toBe(stoppedAt);
		expect(screen.getByRole('button', { name: 'Back to top' })).toBeInTheDocument();
	});

	test('jumps straight to the top under reduced motion', async () => {
		vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
		const target = scroller();
		render(BackToTop, { props: { target } });
		await scrollTo(target, 600);
		await fireEvent.click(screen.getByRole('button', { name: 'Back to top' }));
		expect(target.scrollTop).toBe(0);
		await advance(20);
		expect(screen.queryByRole('button')).toBeNull();
	});

	test('waits for a target that has not mounted yet', async () => {
		const { rerender } = render(BackToTop, { props: { target: null } });
		expect(screen.queryByRole('button')).toBeNull();
		const target = scroller();
		await rerender({ target });
		await scrollTo(target, 500);
		expect(screen.getByRole('button', { name: 'Back to top' })).toBeInTheDocument();
	});

	test('follows the page when no target is given', async () => {
		Object.defineProperty(document.documentElement, 'scrollHeight', {
			value: 3000,
			configurable: true
		});
		vi.stubGlobal('innerHeight', 1000);
		render(BackToTop, { props: { label: 'Scroll to top' } });
		vi.stubGlobal('scrollY', 1500);
		await fireEvent.scroll(window);
		await advance(20);
		expect(screen.getByRole('button', { name: 'Scroll to top' })).toBeInTheDocument();
	});

	test('hands focus to the main content after a trip up the page', async () => {
		Object.defineProperty(document.documentElement, 'scrollHeight', {
			value: 3000,
			configurable: true
		});
		vi.stubGlobal('innerHeight', 1000);
		vi.stubGlobal('scrollY', 1500);
		vi.stubGlobal('scrollTo', (options: ScrollToOptions) => {
			vi.stubGlobal('scrollY', options.top ?? 0);
			window.dispatchEvent(new Event('scroll'));
		});
		const main = document.createElement('main');
		document.body.append(main);
		render(BackToTop);
		await fireEvent.scroll(window);
		await advance(20);
		const button = screen.getByRole('button', { name: 'Back to top' });
		button.focus();

		await fireEvent.click(button);
		await advance(1500);
		expect(screen.queryByRole('button')).toBeNull();
		expect(main).toHaveAttribute('tabindex', '-1');
		expect(document.activeElement).toBe(main);
	});

	test('stops listening and animating when destroyed', async () => {
		const target = scroller();
		const { unmount } = render(BackToTop, { props: { target } });
		await scrollTo(target, 600);
		await fireEvent.click(screen.getByRole('button', { name: 'Back to top' }));
		await advance(100);
		unmount();
		expect(vi.getTimerCount()).toBe(0);
	});
});
