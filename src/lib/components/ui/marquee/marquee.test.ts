import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';

import Marquee from './marquee.svelte';

function stubReducedMotion(reduce: boolean) {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: reduce && query.includes('reduce'),
		media: query,
		addEventListener() {},
		removeEventListener() {}
	}));
}

function stubResizeObserver() {
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
	return observers;
}

const children = createRawSnippet(() => ({
	render: () => '<span><button type="button">Plan a trip</button></span>'
}));

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe('Marquee', () => {
	test('renders a hidden, inert duplicate so the loop is seamless but read once', () => {
		stubReducedMotion(false);
		const { container } = render(Marquee, { children });
		const copies = container.querySelectorAll('.marquee-copy');

		expect(copies).toHaveLength(2);
		expect(copies[0]).not.toHaveAttribute('aria-hidden');
		expect(copies[1]).toHaveAttribute('aria-hidden', 'true');
		expect(copies[1]).toHaveAttribute('inert');
		expect(screen.getAllByRole('button', { name: 'Plan a trip' })).toHaveLength(1);
	});

	test('derives the loop duration from the measured copy and the speed', async () => {
		stubReducedMotion(false);
		const observers = stubResizeObserver();
		vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
			width: 400,
			height: 40
		} as DOMRect);
		vi.spyOn(window, 'getComputedStyle').mockReturnValue({
			columnGap: '16px',
			rowGap: '8px'
		} as CSSStyleDeclaration);

		const { container, rerender, unmount } = render(Marquee, { children, speed: 52, gap: '1rem' });
		const root = container.firstElementChild as HTMLElement;
		expect(root).not.toHaveAttribute('data-running');
		expect(root.style.getPropertyValue('--marquee-gap')).toBe('1rem');

		observers[0].callback([], {} as ResizeObserver);
		await rerender({ speed: 52 });
		expect(root.style.getPropertyValue('--marquee-duration')).toBe('8.00s');
		expect(root).toHaveAttribute('data-running');

		await rerender({ direction: 'up', speed: 12 });
		observers.at(-1)?.callback([], {} as ResizeObserver);
		await rerender({ direction: 'up', speed: 12 });
		expect(root.style.getPropertyValue('--marquee-duration')).toBe('4.00s');

		unmount();
		for (const observer of observers) expect(observer.disconnect).toHaveBeenCalled();
	});

	test('exposes pause controls to the stylesheet', async () => {
		stubReducedMotion(false);
		const { container, rerender } = render(Marquee, { children });
		const root = container.firstElementChild as HTMLElement;
		expect(root).toHaveAttribute('data-pause-on-hover');
		expect(root).toHaveAttribute('data-fade');
		expect(root).not.toHaveAttribute('data-paused');

		await rerender({ paused: true, pauseOnHover: false, fade: false });
		expect(root).toHaveAttribute('data-paused');
		expect(root).not.toHaveAttribute('data-pause-on-hover');
		expect(root).not.toHaveAttribute('data-fade');
	});

	test('becomes a plain scrollable row for reduced motion', () => {
		stubReducedMotion(true);
		const observers = stubResizeObserver();
		const { container } = render(Marquee, { children });
		const root = container.firstElementChild as HTMLElement;

		expect(container.querySelectorAll('.marquee-copy')).toHaveLength(1);
		expect(root).toHaveAttribute('data-reduced-motion');
		expect(root).not.toHaveAttribute('data-running');
		expect(root).not.toHaveAttribute('data-fade');
		expect(root).toHaveAttribute('tabindex', '0');
		expect(observers).toHaveLength(0);
	});

	test('adds a lens copy that stays hidden, inert, and out of the pointer path', async () => {
		stubReducedMotion(false);
		const { container, rerender } = render(Marquee, { children, lens: true });
		const root = container.firstElementChild as HTMLElement;
		const lens = container.querySelector('.marquee-lens');

		expect(root).toHaveAttribute('data-lens');
		expect(lens).toHaveAttribute('aria-hidden', 'true');
		expect(lens).toHaveAttribute('inert');
		expect(lens).toHaveClass('pointer-events-none');
		expect(container.querySelectorAll('.marquee-copy')).toHaveLength(4);
		expect(screen.getAllByRole('button', { name: 'Plan a trip' })).toHaveLength(1);

		await rerender({ lens: false });
		expect(root).not.toHaveAttribute('data-lens');
		expect(container.querySelector('.marquee-lens')).toBeNull();
	});

	test('keeps a still row free of the lens under reduced motion', () => {
		stubReducedMotion(true);
		const { container } = render(Marquee, { children, lens: true });
		expect(container.querySelector('.marquee-lens')).toBeNull();
		expect(container.firstElementChild).not.toHaveAttribute('data-lens');
	});

	test('brakes gently on hover and eases back up when the pointer leaves', async () => {
		vi.useFakeTimers();
		stubReducedMotion(false);
		const loop = { playbackRate: 1, currentTime: 0 };
		const { container } = render(Marquee, { children });
		const root = container.firstElementChild as HTMLElement;
		for (const copy of container.querySelectorAll<HTMLElement>('.marquee-copy')) {
			copy.getAnimations = () => [loop as unknown as Animation];
		}

		await fireEvent.pointerEnter(root, { pointerType: 'mouse' });
		await act(() => vi.advanceTimersByTimeAsync(100));
		// Slowing, not stopped dead.
		expect(loop.playbackRate).toBeGreaterThan(0);
		expect(loop.playbackRate).toBeLessThan(1);
		await act(() => vi.advanceTimersByTimeAsync(400));
		expect(loop.playbackRate).toBe(0);

		await fireEvent.pointerLeave(root, { pointerType: 'mouse' });
		await act(() => vi.advanceTimersByTimeAsync(100));
		expect(loop.playbackRate).toBeGreaterThan(0);
		expect(loop.playbackRate).toBeLessThan(1);
		await act(() => vi.advanceTimersByTimeAsync(600));
		expect(loop.playbackRate).toBe(1);
		vi.useRealTimers();
	});

	test('still brakes when the consumer listens for the pointer too', async () => {
		vi.useFakeTimers();
		stubReducedMotion(false);
		const loop = { playbackRate: 1, currentTime: 0 };
		const onpointerenter = vi.fn();
		const onpointerleave = vi.fn();
		const { container } = render(Marquee, { children, onpointerenter, onpointerleave });
		const root = container.firstElementChild as HTMLElement;
		for (const copy of container.querySelectorAll<HTMLElement>('.marquee-copy')) {
			copy.getAnimations = () => [loop as unknown as Animation];
		}
		await fireEvent.pointerEnter(root, { pointerType: 'mouse' });
		await act(() => vi.advanceTimersByTimeAsync(500));
		expect(onpointerenter).toHaveBeenCalledTimes(1);
		expect(loop.playbackRate).toBe(0);
		await fireEvent.pointerLeave(root, { pointerType: 'mouse' });
		expect(onpointerleave).toHaveBeenCalledTimes(1);
		vi.useRealTimers();
	});

	test('keeps its speed on hover when pauseOnHover is off', async () => {
		vi.useFakeTimers();
		stubReducedMotion(false);
		const loop = { playbackRate: 1 };
		const { container } = render(Marquee, { children, pauseOnHover: false });
		for (const copy of container.querySelectorAll<HTMLElement>('.marquee-copy')) {
			copy.getAnimations = () => [loop as unknown as Animation];
		}
		await fireEvent.pointerEnter(container.firstElementChild as HTMLElement);
		await act(() => vi.advanceTimersByTimeAsync(500));
		expect(loop.playbackRate).toBe(1);
		vi.useRealTimers();
	});
});
