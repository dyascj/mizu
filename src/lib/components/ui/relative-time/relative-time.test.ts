import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import RelativeTime from './relative-time.svelte';

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

const NOW = Date.UTC(2026, 8, 26, 12, 0, 0);
const SEC = 1000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

beforeEach(() => {
	Element.prototype.animate = fakeAnimate;
	vi.useFakeTimers({ now: NOW });
});

afterEach(() => {
	Element.prototype.animate = nativeAnimate;
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

const spoken = (container: HTMLElement) => container.querySelector('.sr-only')?.textContent;

describe('RelativeTime', () => {
	test.each([
		[5 * SEC, 'just now'],
		[45 * SEC, '45 sec ago'],
		[5 * MIN, '5 min ago'],
		[3 * HOUR, '3 hr ago'],
		[30 * HOUR, 'yesterday'],
		[3 * DAY, '3 days ago'],
		[25 * DAY, 'Sep 1']
	])('describes %i ms ago as "%s"', (diff, label) => {
		const { container } = render(RelativeTime, { date: NOW - diff, now: NOW, locale: 'en-US' });
		expect(spoken(container)).toBe(label);
	});

	test.each([
		[5 * SEC, 'just now'],
		[45 * SEC, 'in 45 sec'],
		[5 * MIN, 'in 5 min'],
		[3 * HOUR, 'in 3 hr'],
		[30 * HOUR, 'tomorrow'],
		[3 * DAY, 'in 3 days'],
		[25 * DAY, 'Oct 21']
	])('describes %i ms from now as "%s"', (ahead, label) => {
		const { container } = render(RelativeTime, { date: NOW + ahead, now: NOW, locale: 'en-US' });
		expect(spoken(container)).toBe(label);
	});

	test('counts down to a moment still to come, then past it', async () => {
		const { container } = render(RelativeTime, { date: NOW + 61 * SEC });
		expect(spoken(container)).toBe('in 1 min');
		await act(() => vi.advanceTimersByTimeAsync(1 * SEC + 50));
		expect(spoken(container)).toBe('in 59 sec');
		await act(() => vi.advanceTimersByTimeAsync(50 * SEC));
		expect(spoken(container)).toBe('just now');
		await act(() => vi.advanceTimersByTimeAsync(20 * SEC));
		expect(spoken(container)).toBe('10 sec ago');
	});

	test('carries a machine-readable datetime and is focusable', () => {
		render(RelativeTime, { date: '2026-09-26T11:55:00Z', now: NOW });
		const time = document.querySelector('time') as HTMLElement;
		expect(time).toHaveAttribute('datetime', '2026-09-26T11:55:00.000Z');
		expect(time).toHaveAttribute('tabindex', '0');
	});

	test('holds a placeholder while the moment is unknown', () => {
		const { container } = render(RelativeTime, { date: null });
		const time = container.querySelector('time') as HTMLElement;
		expect(time).not.toHaveAttribute('tabindex');
		expect(time).not.toHaveAttribute('datetime');
		expect(spoken(container)).toBeUndefined();
	});

	test('keeps itself current on the live clock, waking only when the label changes', async () => {
		const { container, unmount } = render(RelativeTime, { date: NOW - 58 * SEC });
		expect(spoken(container)).toBe('58 sec ago');
		// Wakes just past each boundary.
		await act(() => vi.advanceTimersByTimeAsync(1 * SEC + 50));
		expect(spoken(container)).toBe('59 sec ago');
		await act(() => vi.advanceTimersByTimeAsync(1 * SEC));
		expect(spoken(container)).toBe('1 min ago');
		// Next change is a minute away: one timer, not one per second.
		expect(vi.getTimerCount()).toBe(1);
		unmount();
		expect(vi.getTimerCount()).toBe(0);
	});

	test('shows the full date instantly on focus and hides it on Escape', async () => {
		render(RelativeTime, { date: NOW - 5 * MIN, now: NOW, locale: 'en-US' });
		const time = document.querySelector('time') as HTMLElement;
		await fireEvent.focus(time);
		const tip = screen.getByRole('tooltip');
		expect(tip).toHaveTextContent('Sat, Sep 26, 2026');
		expect(time).toHaveAttribute('aria-describedby', tip.id);

		await fireEvent.keyDown(time, { key: 'Escape' });
		await act(() => vi.advanceTimersByTimeAsync(200));
		expect(screen.queryByRole('tooltip')).toBeNull();
		expect(time).not.toHaveAttribute('aria-describedby');
	});

	test('waits before opening on hover', async () => {
		vi.setSystemTime(NOW + 10 * SEC);
		render(RelativeTime, { date: NOW - 5 * MIN, now: NOW });
		const time = document.querySelector('time') as HTMLElement;
		await fireEvent.pointerEnter(time, { pointerType: 'mouse' });
		expect(screen.queryByRole('tooltip')).toBeNull();
		await act(() => vi.advanceTimersByTimeAsync(450));
		expect(screen.getByRole('tooltip')).toBeInTheDocument();
	});
});
