import { act, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Greeting from './greeting.svelte';
import { moonPhase, periodOf } from './greeting.svelte';

// jsdom has no Web Animations; finish every Svelte transition on the next tick.
beforeEach(() => {
	Element.prototype.animate = function () {
		const animation = { onfinish: null as null | (() => void), cancel() {}, currentTime: 0 };
		setTimeout(() => animation.onfinish?.());
		return animation as unknown as Animation;
	};
});

afterEach(() => {
	delete (Element.prototype as Partial<Element>).animate;
	vi.useRealTimers();
});

describe('periodOf', () => {
	test('splits the day into four parts', () => {
		expect(periodOf(5)).toBe('morning');
		expect(periodOf(11)).toBe('morning');
		expect(periodOf(12)).toBe('afternoon');
		expect(periodOf(17)).toBe('evening');
		expect(periodOf(22)).toBe('night');
		expect(periodOf(3)).toBe('night');
	});
});

describe('moonPhase', () => {
	test('stays within one cycle and finds a known full moon', () => {
		// 2024-01-25 17:54 UTC was a full moon.
		expect(moonPhase(Date.UTC(2024, 0, 25, 17, 54))).toBeCloseTo(0.5, 1);
		expect(moonPhase(Date.UTC(1990, 0, 1))).toBeGreaterThanOrEqual(0);
		expect(moonPhase(Date.UTC(1990, 0, 1))).toBeLessThan(1);
	});
});

describe('Greeting', () => {
	test('greets by the time of day with the name', () => {
		const { container } = render(Greeting, { name: 'Ada', date: new Date(2026, 8, 26, 9, 30) });
		expect(screen.getByText('Good morning, Ada')).toHaveClass('sr-only');
		expect(container.firstElementChild).toHaveAttribute('data-period', 'morning');
		expect(container.querySelector('[data-glyph="sun"]')).not.toBeNull();
	});

	test('shows the moon after dark', () => {
		const { container } = render(Greeting, { name: 'Ada', date: new Date(2026, 8, 26, 21, 5) });
		expect(screen.getByText('Good evening, Ada')).toBeInTheDocument();
		expect(container.querySelector('[data-glyph="moon"]')).not.toBeNull();
	});

	test('never says good night, and takes other words', () => {
		const late = new Date(2026, 8, 26, 23, 40);
		const { unmount } = render(Greeting, { name: 'Ada', date: late });
		expect(screen.getByText('Up late, Ada')).toBeInTheDocument();
		unmount();
		render(Greeting, { name: 'Ada', date: late, words: { night: 'Bonsoir' } });
		expect(screen.getByText('Bonsoir, Ada')).toBeInTheDocument();
	});

	test('works without a name and renders as a heading', () => {
		render(Greeting, { as: 'h1', date: new Date(2026, 8, 26, 14, 0) });
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Good afternoon');
	});

	test('reads the local clock after mount and follows it minute by minute', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 8, 26, 11, 59, 30));
		render(Greeting, { name: 'Ada' });
		expect(screen.getByText('Good morning, Ada')).toBeInTheDocument();
		await act(() => vi.advanceTimersByTimeAsync(60_000));
		expect(screen.getByText('Good afternoon, Ada')).toBeInTheDocument();
	});

	test('stops its clock when destroyed', async () => {
		vi.useFakeTimers();
		const { unmount } = render(Greeting, { name: 'Ada' });
		await act(() => vi.advanceTimersByTimeAsync(1000));
		expect(vi.getTimerCount()).toBe(1);
		unmount();
		expect(vi.getTimerCount()).toBe(0);
	});
});
