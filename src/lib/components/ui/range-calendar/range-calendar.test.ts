import { fireEvent, render, screen } from '@testing-library/svelte';
import { CalendarDate } from '@internationalized/date';
import { tick } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';

import RangeCalendar from './range-calendar.svelte';

const september = new CalendarDate(2026, 9, 15);

const day = (container: HTMLElement, iso: string) =>
	container.querySelector<HTMLElement>(`[data-bits-day][data-value="${iso}"]`)!;
const band = (container: HTMLElement) =>
	[...container.querySelectorAll('[data-range-band]')].map((node) =>
		node.closest('td')?.querySelector('[data-bits-day]')?.getAttribute('data-value')
	);

// jsdom has no Web Animations API. This stand-in lets Svelte's transitions
// start and then holds every timed animation until the test lets them finish.
const nativeAnimate = Element.prototype.animate;
const running = new Set<() => void>();

function holdAnimations() {
	Element.prototype.animate = function (_keyframes, options) {
		const timed = Number((options as KeyframeAnimationOptions | undefined)?.duration ?? 0) > 0;
		let cancelled = false;
		let handler: (() => void) | null = null;
		const finish = () => {
			running.delete(finish);
			if (!cancelled) handler?.();
		};
		if (timed) running.add(finish);
		return {
			currentTime: 0,
			playState: 'running',
			effect: null,
			cancel() {
				cancelled = true;
				running.delete(finish);
			},
			get onfinish() {
				return handler;
			},
			set onfinish(fn: (() => void) | null) {
				handler = fn;
				if (!timed) queueMicrotask(finish);
			}
		} as unknown as Animation;
	};
}

async function finishAnimations() {
	for (const finish of [...running]) finish();
	await tick();
}

afterEach(() => {
	Element.prototype.animate = nativeAnimate;
	running.clear();
});

describe('RangeCalendar', () => {
	test('paints the span toward the pointer after the first click and commits on the second', async () => {
		const onValueChange = vi.fn();
		const { container } = render(RangeCalendar, { placeholder: september, onValueChange });

		await fireEvent.click(day(container, '2026-09-09'));
		expect(band(container)).toEqual([]);

		await fireEvent.pointerOver(day(container, '2026-09-12'));
		expect(band(container)).toEqual(['2026-09-09', '2026-09-10', '2026-09-11', '2026-09-12']);
		expect(day(container, '2026-09-12').closest('td')).toHaveAttribute('data-prospective');

		await fireEvent.click(day(container, '2026-09-12'));
		expect(onValueChange).toHaveBeenLastCalledWith({
			start: new CalendarDate(2026, 9, 9),
			end: new CalendarDate(2026, 9, 12)
		});
		expect(day(container, '2026-09-12').closest('td')).not.toHaveAttribute('data-prospective');
		expect(band(container)).toHaveLength(4);
	});

	test('paints backwards when the pointer moves before the start', async () => {
		const { container } = render(RangeCalendar, { placeholder: september });
		await fireEvent.click(day(container, '2026-09-09'));
		await fireEvent.pointerOver(day(container, '2026-09-07'));
		expect(band(container)).toEqual(['2026-09-07', '2026-09-08', '2026-09-09']);
	});

	test('keyboard focus paints the span too, and leaving the grid lets go', async () => {
		const { container } = render(RangeCalendar, { placeholder: september });
		await fireEvent.click(day(container, '2026-09-09'));
		await fireEvent.focusIn(day(container, '2026-09-11'));
		expect(band(container)).toHaveLength(3);

		await fireEvent.pointerLeave(container.querySelector('[data-range-calendar-root]')!);
		expect(band(container)).toEqual([]);
	});

	test('Escape backs out of a half-picked range', async () => {
		const onValueChange = vi.fn();
		const { container } = render(RangeCalendar, { placeholder: september, onValueChange });
		await fireEvent.click(day(container, '2026-09-09'));
		await fireEvent.keyDown(day(container, '2026-09-09'), { key: 'Escape' });
		expect(onValueChange).toHaveBeenLastCalledWith({ start: undefined, end: undefined });
		expect(container.querySelectorAll('[data-bits-day][data-selected]')).toHaveLength(0);
	});

	test('arrow keys follow the mirrored grid in right-to-left text', async () => {
		document.body.style.direction = 'rtl';
		try {
			const { container } = render(RangeCalendar, { placeholder: september });
			day(container, '2026-09-09').focus();
			await fireEvent.keyDown(day(container, '2026-09-09'), { key: 'ArrowLeft' });
			expect(day(container, '2026-09-10')).toHaveFocus();
			await fireEvent.keyDown(day(container, '2026-09-10'), { key: 'ArrowRight' });
			await fireEvent.keyDown(day(container, '2026-09-09'), { key: 'ArrowRight' });
			expect(day(container, '2026-09-08')).toHaveFocus();
		} finally {
			document.body.style.direction = '';
		}
	});

	test('rounds the band where a week breaks it', async () => {
		const { container } = render(RangeCalendar, {
			placeholder: september,
			value: { start: new CalendarDate(2026, 9, 10), end: new CalendarDate(2026, 9, 15) }
		});
		const cells = [...container.querySelectorAll('[data-range-band]')];
		expect(cells).toHaveLength(6);
		// Sep 12 ends a week and Sep 13 starts one.
		const classOf = (iso: string) =>
			day(container, iso).closest('td')!.querySelector('[data-range-band]')!.getAttribute('class');
		expect(classOf('2026-09-12')).toContain('group-last/cell:rounded-e-full');
		expect(classOf('2026-09-13')).toContain('group-first/cell:rounded-s-full');
		expect(classOf('2026-09-10')).toContain('start-1/2');
		expect(classOf('2026-09-15')).toContain('end-1/2');
	});

	test('slides to the next month', async () => {
		const { container } = render(RangeCalendar, { placeholder: september });
		await fireEvent.click(screen.getByRole('button', { name: /next/i }));
		expect(await screen.findByText('October 2026')).toBeInTheDocument();
		expect(container.querySelectorAll('table')).toHaveLength(1);
	});

	test('crossfades the month title in one grid cell', async () => {
		holdAnimations();
		render(RangeCalendar, { placeholder: september });
		await fireEvent.click(screen.getByRole('button', { name: /next/i }));
		await tick();

		const leaving = screen.getByText('September 2026');
		const arriving = screen.getByText('October 2026');
		expect(leaving.parentElement).toBe(arriving.parentElement);
		expect(leaving.parentElement).toHaveClass('grid');
		for (const title of [leaving, arriving]) {
			expect(title).toHaveClass('col-start-1', 'row-start-1');
		}

		await finishAnimations();
		expect(screen.queryByText('September 2026')).not.toBeInTheDocument();
		expect(screen.getByText('October 2026')).toBeInTheDocument();
	});

	test('paging back before the old month has left keeps one live grid', async () => {
		holdAnimations();
		const { container } = render(RangeCalendar, { placeholder: september });
		await fireEvent.click(screen.getByRole('button', { name: /next/i }));
		await tick();
		await fireEvent.click(screen.getByRole('button', { name: /previous/i }));
		await tick();
		await finishAnimations();

		const grids = container.querySelectorAll('table');
		expect(grids).toHaveLength(1);
		expect(grids[0].parentElement!.style.position).not.toBe('absolute');
		expect(grids[0].parentElement!.style.pointerEvents).not.toBe('none');
		await fireEvent.click(day(container, '2026-09-09'));
		expect(day(container, '2026-09-09')).toHaveAttribute('data-selected');
	});
});
