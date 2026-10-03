import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { CalendarDate } from '@internationalized/date';
import { afterEach, describe, expect, test, vi } from 'vitest';

import Calendar from './calendar.svelte';
import Harness from './calendar.test.svelte';

const september = new CalendarDate(2026, 9, 15);

const day = (container: HTMLElement, iso: string) =>
	container.querySelector<HTMLElement>(`[data-bits-day][data-value="${iso}"]`)!;

// jsdom has no Web Animations API. This stand-in lets Svelte's transitions
// start and then holds every timed animation until the test lets them finish,
// so a month grid can be caught mid-exit.
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
	vi.restoreAllMocks();
});

describe('Calendar', () => {
	test('selects a day and paints one fill behind it', async () => {
		const onValueChange = vi.fn();
		const { container } = render(Calendar, {
			type: 'single',
			placeholder: september,
			onValueChange
		});
		await fireEvent.click(day(container, '2026-09-10'));
		expect(onValueChange).toHaveBeenLastCalledWith(new CalendarDate(2026, 9, 10));
		expect(day(container, '2026-09-10')).toHaveAttribute('data-selected');
		expect(day(container, '2026-09-10').querySelector('[data-day-fill]')).not.toBeNull();

		await fireEvent.click(day(container, '2026-09-24'));
		expect(container.querySelectorAll('[data-day-fill]')).toHaveLength(1);
		expect(day(container, '2026-09-24').querySelector('[data-day-fill]')).not.toBeNull();
	});

	test('in flight the fill carries the color and the days never fade their own', async () => {
		const { container } = render(Calendar, { type: 'single', placeholder: september });
		await fireEvent.click(day(container, '2026-09-10'));

		// jsdom has no stylesheet; stand in for a day's background and transitions.
		const real = window.getComputedStyle;
		vi.spyOn(window, 'getComputedStyle').mockImplementation((el, pseudo) =>
			el instanceof HTMLElement && el.hasAttribute('data-bits-day')
				? ({
						backgroundColor: 'rgb(23, 23, 23)',
						transitionProperty: 'background-color, color',
						transitionDuration: '0.24s',
						transitionTimingFunction: 'ease',
						transitionDelay: '0s'
					} as CSSStyleDeclaration)
				: real(el, pseudo)
		);
		await fireEvent.click(day(container, '2026-09-24'));
		const from = day(container, '2026-09-10');
		const to = day(container, '2026-09-24');
		const fill = to.querySelector<HTMLElement>('[data-day-fill]')!;

		// Neither day fades its background, so no ghost stays behind and the fill
		// leaves in its final color.
		expect(from.style.transition).toBe('color 0.24s ease 0s');
		expect(to.style.transition).toBe('color 0.24s ease 0s');
		// The new day paints nothing of its own until the fill lands.
		expect(fill.style.backgroundColor).toBe('rgb(23, 23, 23)');
		expect(to.style.backgroundColor).toBe('transparent');

		const landed = new Event('transitionend');
		Object.assign(landed, { propertyName: 'translate' });
		fill.dispatchEvent(landed);
		expect(fill.style.backgroundColor).toBe('');
		expect(to.style.backgroundColor).toBe('');
	});

	test('shows one month at a time as it pages, with the title following', async () => {
		const { container } = render(Calendar, { type: 'single', placeholder: september });
		expect(screen.getByText('September 2026')).toBeInTheDocument();

		await fireEvent.click(screen.getByRole('button', { name: /next/i }));
		expect(await screen.findByText('October 2026')).toBeInTheDocument();
		expect(screen.queryByText('September 2026')).not.toBeInTheDocument();
		expect(container.querySelectorAll('table')).toHaveLength(1);

		await fireEvent.click(screen.getByRole('button', { name: /previous/i }));
		expect(await screen.findByText('September 2026')).toBeInTheDocument();
	});

	test('arrow keys walk off the edge of a month into the next grid', async () => {
		const { container } = render(Calendar, {
			type: 'single',
			placeholder: new CalendarDate(2026, 9, 1)
		});
		const first = day(container, '2026-09-01');
		first.focus();
		await fireEvent.keyDown(first, { key: 'ArrowUp' });
		await vi.waitFor(() =>
			expect(document.activeElement).toHaveAttribute('data-value', '2026-08-25')
		);
		expect(screen.getByText('August 2026')).toBeInTheDocument();
	});

	test('right to left, ArrowLeft moves to the next day and ArrowRight to the previous', async () => {
		const target = document.body.appendChild(document.createElement('div'));
		target.dir = 'rtl';
		target.style.direction = 'rtl';
		const { container } = render(Calendar, {
			target,
			props: { type: 'single', placeholder: september }
		});
		const start = day(container, '2026-09-15');
		start.focus();
		await fireEvent.keyDown(start, { key: 'ArrowLeft' });
		await vi.waitFor(() =>
			expect(document.activeElement).toHaveAttribute('data-value', '2026-09-16')
		);
		await fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
		await fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
		await vi.waitFor(() =>
			expect(document.activeElement).toHaveAttribute('data-value', '2026-09-14')
		);
		target.remove();
	});

	test('keeps the existing caption dropdowns working', () => {
		render(Calendar, { type: 'single', placeholder: september, captionLayout: 'dropdown' });
		expect(screen.getAllByRole('combobox').length).toBeGreaterThan(0);
	});

	test('paging back before the old month has left mounts a live grid, not the retired one', async () => {
		holdAnimations();
		const { container } = render(Calendar, { type: 'single', placeholder: september });

		await fireEvent.click(screen.getByRole('button', { name: /next/i }));
		await tick();
		await fireEvent.click(screen.getByRole('button', { name: /previous/i }));
		await tick();

		// The grids still fading out sit out of reach; exactly one grid is live.
		const live = () =>
			[...container.querySelectorAll('table')].filter((grid) =>
				grid.querySelector('[data-bits-day]')
			);
		expect(live()).toHaveLength(1);
		const wrapper = live()[0].parentElement!;
		expect(wrapper.style.position).not.toBe('absolute');
		expect(wrapper.style.pointerEvents).not.toBe('none');
		expect(day(container, '2026-09-10')).not.toBeNull();

		await finishAnimations();
		expect(container.querySelectorAll('table')).toHaveLength(1);
		expect(live()).toHaveLength(1);
		expect(live()[0].parentElement!.style.position).not.toBe('absolute');
		await fireEvent.click(day(container, '2026-09-10'));
		expect(day(container, '2026-09-10')).toHaveAttribute('data-selected');
	});

	test('the selected fill takes its color from the day, so class overrides still apply', async () => {
		const { container } = render(Harness, {
			value: september,
			placeholder: september,
			dayClass: 'data-[selected]:bg-destructive'
		});
		const selected = day(container, '2026-09-15');
		expect(selected).toHaveAttribute('data-selected');
		expect(selected).toHaveClass('data-[selected]:bg-destructive');
		expect(selected).not.toHaveClass('data-[selected]:bg-primary');

		const fill = selected.querySelector('[data-day-fill]')!;
		expect(fill).toHaveClass('bg-inherit');
		expect([...fill.classList].filter((name) => /^bg-/.test(name))).toEqual(['bg-inherit']);
	});

	test('a selected day without overrides keeps the primary fill', () => {
		const { container } = render(Calendar, {
			type: 'single',
			value: september,
			placeholder: september
		});
		expect(day(container, '2026-09-15')).toHaveClass('data-[selected]:bg-primary');
	});
});
