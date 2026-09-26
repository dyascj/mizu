import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import PullToRefresh from './pull-to-refresh.svelte';

// jsdom has no element scrolling; the refresh button scrolls the feed back up first.
const nativeScrollTo = Element.prototype.scrollTo;

beforeEach(() => {
	vi.useFakeTimers();
	Element.prototype.scrollTo = () => {};
});

afterEach(() => {
	vi.useRealTimers();
	Element.prototype.scrollTo = nativeScrollTo;
	vi.unstubAllGlobals();
});

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
const children = createRawSnippet(() => ({ render: () => '<ul><li>Research agent</li></ul>' }));

function setup(props: Record<string, unknown> = {}) {
	let finish: (value?: unknown) => void = () => {};
	const onRefresh = vi.fn(() => new Promise((resolve) => (finish = resolve)));
	const result = render(PullToRefresh, { props: { onRefresh, children, ...props } });
	const region = screen.getByRole('region', { name: 'Feed' });
	Object.defineProperty(region, 'clientHeight', { value: 480 });
	return { ...result, region, onRefresh, finish: (value?: unknown) => finish(value) };
}

const live = (container: HTMLElement) => container.querySelector('[aria-live="polite"]');
const offset = (region: HTMLElement) =>
	parseFloat((region.firstElementChild as HTMLElement).style.translate.split(' ')[1] ?? '0') || 0;

/** A mouse pull of `distance` pixels in even steps, a frame apart. */
async function pull(region: HTMLElement, distance: number) {
	await fireEvent.pointerDown(region, {
		pointerType: 'mouse',
		button: 0,
		pointerId: 1,
		clientY: 0
	});
	for (let y = 10; y <= distance; y += 10) {
		await fireEvent.pointerMove(region, { pointerType: 'mouse', pointerId: 1, clientY: y });
		await advance(16);
	}
	await fireEvent.pointerUp(region, { pointerType: 'mouse', pointerId: 1, clientY: distance });
}

describe('PullToRefresh', () => {
	test('gives keyboard and screen reader users a refresh button', async () => {
		const { container, onRefresh, region, finish } = setup();
		const button = screen.getByRole('button', { name: 'Refresh' });
		await fireEvent.click(button);
		expect(onRefresh).toHaveBeenCalledTimes(1);
		expect(region).toHaveAttribute('aria-busy', 'true');
		expect(button).toHaveAttribute('aria-disabled', 'true');

		// A second press while busy does nothing.
		await fireEvent.click(button);
		expect(onRefresh).toHaveBeenCalledTimes(1);

		await act(() => finish('2 new runs'));
		await advance(0);
		expect(region).toHaveAttribute('aria-busy', 'false');
		expect(live(container)?.textContent).toBe('2 new runs');
	});

	test('announces a default or failure message', async () => {
		const { container, finish } = setup({ refreshedLabel: 'Feed updated' });
		await fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
		await act(() => finish());
		await advance(0);
		expect(live(container)?.textContent).toBe('Feed updated');

		const onRefresh = vi.fn(() => Promise.reject(new Error('offline')));
		const failing = render(PullToRefresh, {
			props: { onRefresh, children, label: 'Runs', refreshLabel: 'Reload' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Reload' }));
		await advance(0);
		expect(live(failing.container)?.textContent).toBe('Could not refresh');
	});

	test('a pull past the threshold refreshes, with the rubber band resisting', async () => {
		const { region, onRefresh } = setup();
		await pull(region, 150);
		expect(onRefresh).toHaveBeenCalledTimes(1);
		// 150px of hand travel shows less than 150px of feed.
		expect(region).toHaveAttribute('aria-busy', 'true');
		await advance(1000);
		expect(offset(region)).toBeCloseTo(64, 0);
	});

	test('a short pull springs back without refreshing', async () => {
		const { region, onRefresh } = setup();
		await fireEvent.pointerDown(region, {
			pointerType: 'mouse',
			button: 0,
			pointerId: 1,
			clientY: 0
		});
		for (let y = 10; y <= 60; y += 10) {
			await fireEvent.pointerMove(region, { pointerType: 'mouse', pointerId: 1, clientY: y });
		}
		const pulled = offset(region);
		expect(pulled).toBeGreaterThan(30);
		expect(pulled).toBeLessThan(56);
		await fireEvent.pointerUp(region, { pointerType: 'mouse', pointerId: 1 });
		await advance(1000);
		expect(onRefresh).not.toHaveBeenCalled();
		expect(offset(region)).toBe(0);
	});

	test('ignores pulls once scrolled down, while disabled, and from touch pointers', async () => {
		const { region, onRefresh } = setup();
		region.scrollTop = 40;
		await pull(region, 150);
		expect(onRefresh).not.toHaveBeenCalled();

		region.scrollTop = 0;
		await fireEvent.pointerDown(region, { pointerType: 'touch', button: 0, pointerId: 2 });
		await fireEvent.pointerMove(region, { pointerType: 'touch', pointerId: 2, clientY: 200 });
		expect(offset(region)).toBe(0);
	});

	test('does nothing while disabled', async () => {
		const { region, onRefresh } = setup({ disabled: true });
		await pull(region, 150);
		expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled();
		expect(onRefresh).not.toHaveBeenCalled();
	});

	test('swallows the click that ends a mouse pull', async () => {
		const onclick = vi.fn();
		const { region } = setup();
		region.addEventListener('click', onclick);
		await pull(region, 40);
		await fireEvent.click(region);
		expect(onclick).not.toHaveBeenCalled();
		await advance(10);
		await fireEvent.click(region);
		expect(onclick).toHaveBeenCalledTimes(1);
	});
});
