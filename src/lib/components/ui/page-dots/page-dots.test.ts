import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import PageDots from './page-dots.svelte';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

const dot = (n: number) => screen.getByRole('button', { name: `Page ${n} of 5` });
const pill = (container: HTMLElement) =>
	container.querySelector<HTMLElement>('[role="group"] > span[aria-hidden="true"]');

describe('PageDots', () => {
	test('is a named group of page buttons with the current one marked', () => {
		render(PageDots, { props: { count: 5, index: 1, label: 'Onboarding' } });
		expect(screen.getByRole('group', { name: 'Onboarding' })).toBeInTheDocument();
		expect(screen.getAllByRole('button')).toHaveLength(5);
		expect(dot(2)).toHaveAttribute('aria-current', 'page');
		expect(dot(1)).not.toHaveAttribute('aria-current');
	});

	test('keeps one tab stop on the current page', () => {
		render(PageDots, { props: { count: 5, index: 2 } });
		expect(dot(3)).toHaveAttribute('tabindex', '0');
		expect(dot(1)).toHaveAttribute('tabindex', '-1');
	});

	test('reports the page a reader clicks', async () => {
		const onIndexChange = vi.fn();
		render(PageDots, { props: { count: 5, onIndexChange } });
		await fireEvent.click(dot(4));
		expect(onIndexChange).toHaveBeenCalledWith(3);
	});

	test('moves with the arrow keys, Home, and End', async () => {
		const onIndexChange = vi.fn();
		render(PageDots, { props: { count: 5, progress: 0, onIndexChange } });
		const group = screen.getByRole('group');
		await fireEvent.keyDown(group, { key: 'ArrowRight' });
		expect(onIndexChange).toHaveBeenLastCalledWith(1);
		await fireEvent.keyDown(group, { key: 'End' });
		expect(onIndexChange).toHaveBeenLastCalledWith(4);
		expect(dot(5)).toHaveFocus();
	});

	test('with progress driving it, a dot reports even when it was the last one picked', async () => {
		const onIndexChange = vi.fn();
		const { rerender } = render(PageDots, { props: { count: 5, progress: 0, onIndexChange } });
		await fireEvent.click(dot(2));
		expect(onIndexChange).toHaveBeenLastCalledWith(1);
		// Something else, such as autoplay or a swipe, moves the pages on.
		await rerender({ count: 5, progress: 3, onIndexChange });
		await fireEvent.click(dot(2));
		expect(onIndexChange).toHaveBeenCalledTimes(2);
		expect(onIndexChange).toHaveBeenLastCalledWith(1);
		await rerender({ count: 5, progress: 3, onIndexChange });
		await fireEvent.keyDown(screen.getByRole('group'), { key: 'Home' });
		expect(onIndexChange).toHaveBeenLastCalledWith(0);
	});

	test('follows a continuous progress and switches current at the halfway point', async () => {
		const { container, rerender } = render(PageDots, { props: { count: 5, progress: 1.4 } });
		expect(dot(2)).toHaveAttribute('aria-current', 'page');
		await rerender({ count: 5, progress: 1.6 });
		expect(dot(3)).toHaveAttribute('aria-current', 'page');
		// The row never changes width: four steps of 12px plus one 20px pill.
		expect(screen.getByRole('group').style.width).toBe('68px');
		// Mid-move the pill stretches wider than it rests.
		expect(parseFloat(pill(container)!.style.width)).toBeGreaterThan(20);
	});

	test('rests as a 20px pill on its page', () => {
		const { container } = render(PageDots, { props: { count: 5, progress: 2 } });
		expect(pill(container)!.style.width).toBe('20px');
		expect(pill(container)!.style.transform).toBe('translate(24px, -50%)');
	});

	test('counts down while playing and reports when it elapses', async () => {
		const onElapsed = vi.fn();
		const { container, rerender } = render(PageDots, {
			props: { count: 5, duration: 3000, playing: false, onElapsed }
		});
		expect(container.querySelector('[data-slot="countdown"]')).not.toBeNull();

		await act(() => vi.advanceTimersByTimeAsync(4000));
		expect(onElapsed).not.toHaveBeenCalled();

		await rerender({ count: 5, duration: 3000, playing: true, onElapsed });
		await act(() => vi.advanceTimersByTimeAsync(2000));
		// Pausing and resuming starts the countdown over.
		await rerender({ count: 5, duration: 3000, playing: false, onElapsed });
		await rerender({ count: 5, duration: 3000, playing: true, onElapsed });
		await act(() => vi.advanceTimersByTimeAsync(2000));
		expect(onElapsed).not.toHaveBeenCalled();
		await act(() => vi.advanceTimersByTimeAsync(1000));
		expect(onElapsed).toHaveBeenCalledOnce();
	});

	test('has no countdown without a duration', () => {
		const { container } = render(PageDots, { props: { count: 3 } });
		expect(container.querySelector('[data-slot="countdown"]')).toBeNull();
	});
});
