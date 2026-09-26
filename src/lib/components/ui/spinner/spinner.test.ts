import { act, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { buildPattern, pixelChecks } from './patterns.js';
import Spinner from './spinner.svelte';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

const lit = (container: HTMLElement) =>
	Array.from(container.querySelectorAll<HTMLElement>('[data-on]'))
		.map((cell, i) => (cell.dataset.on === 'true' ? i : -1))
		.filter((i) => i >= 0);

describe('Spinner', () => {
	test('keeps the ring as the default and announces loading', () => {
		const { container } = render(Spinner);
		const status = screen.getByRole('status');
		expect(status).toHaveTextContent('Loading');
		expect(status).toHaveAttribute('data-variant', 'ring');
		expect(container.querySelector('svg')).toHaveAttribute('width', '20');
		expect(container.querySelector('svg')).toHaveClass('animate-spin');
	});

	test('closes the ring into a check and announces the finish', async () => {
		const { container, rerender } = render(Spinner, { doneLabel: 'Reply ready' });
		const arc = container.querySelectorAll('circle')[1];
		const check = container.querySelector('path');
		const quarter = Number(arc.getAttribute('stroke-dasharray')?.split(' ')[0]);
		expect(check).toHaveAttribute('stroke-dashoffset', '1');

		await rerender({ doneLabel: 'Reply ready', done: true });
		expect(Number(arc.getAttribute('stroke-dasharray')?.split(' ')[0])).toBeCloseTo(quarter * 4);
		expect(check).toHaveAttribute('stroke-dashoffset', '0');
		expect(screen.getByRole('status')).toHaveTextContent('Reply ready');
		// The turn stops once the ring is whole.
		expect(container.querySelector('svg')).toHaveClass('[animation-play-state:paused]');
	});

	test('renders three leapfrog dots and a clipped inchworm bar', () => {
		const { container, unmount } = render(Spinner, { variant: 'dots' });
		expect(container.querySelectorAll('.spinner-hop-y')).toHaveLength(3);
		unmount();

		const bar = render(Spinner, { variant: 'bar', label: 'Indexing files' });
		expect(bar.container.querySelector('.spinner-worm')).toBeInTheDocument();
		expect(screen.getByRole('status')).toHaveTextContent('Indexing files');
	});

	test('steps the pixel grid through its patterns and sleeps when unmounted', async () => {
		const { container, unmount } = render(Spinner, {
			variant: 'pixel',
			patterns: ['snake']
		});
		expect(container.querySelectorAll('[data-on]')).toHaveLength(9);

		const frames = buildPattern('snake', 3);
		await act(() => vi.advanceTimersByTimeAsync(0));
		expect(lit(container)).toEqual([...frames[0]].sort((a, b) => a - b));
		await act(() => vi.advanceTimersByTimeAsync(100));
		expect(lit(container)).toEqual([...frames[1]].sort((a, b) => a - b));

		unmount();
		expect(vi.getTimerCount()).toBe(0);
	});

	test('holds still instead of throwing when given no patterns', async () => {
		const { container } = render(Spinner, { variant: 'pixel', patterns: [] });
		await act(() => vi.advanceTimersByTimeAsync(500));
		expect(vi.getTimerCount()).toBe(0);
		expect(container.querySelectorAll('[data-on]')).toHaveLength(9);
	});

	test('lays a pixel check when done, in stroke order', async () => {
		const { container, rerender } = render(Spinner, { variant: 'pixel', grid: 4 });
		await rerender({ variant: 'pixel', grid: 4, done: true });
		expect(lit(container)).toEqual([...pixelChecks[4]].sort((a, b) => a - b));
		const cells = container.querySelectorAll<HTMLElement>('[data-on]');
		const delays = pixelChecks[4].map((i) => parseFloat(cells[i].style.transitionDelay));
		expect(delays).toEqual([...delays].sort((a, b) => a - b));
		expect(vi.getTimerCount()).toBe(0);
	});

	test('holds a still frame when paused or under reduced motion', async () => {
		const paused = render(Spinner, { variant: 'pixel', paused: true });
		await act(() => vi.advanceTimersByTimeAsync(500));
		const frame = lit(paused.container);
		expect(frame.length).toBeGreaterThan(0);
		expect(vi.getTimerCount()).toBe(0);
		paused.unmount();

		vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
		const reduced = render(Spinner, { variant: 'pixel' });
		await act(() => vi.advanceTimersByTimeAsync(500));
		expect(lit(reduced.container)).toEqual(frame);
		expect(vi.getTimerCount()).toBe(0);
	});

	test('builds loops that never jump', () => {
		const spiral = buildPattern('spiral', 3);
		// Winds in and back out: the last frame sits next to the first.
		expect(spiral[0]).toEqual([0]);
		expect(spiral.at(-1)).toEqual([1]);
		expect(buildPattern('pulse', 4).at(-1)).toEqual([]);
		expect(buildPattern('checker', 3)).toHaveLength(4);
	});
});
