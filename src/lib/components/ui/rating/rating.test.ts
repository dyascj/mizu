import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Rating from './rating.svelte';

describe('Rating', () => {
	test('supports arrow, Home, and End keyboard changes', async () => {
		const onValueChange = vi.fn();
		render(Rating, { value: 2, max: 5, onValueChange });
		const slider = screen.getByRole('slider');

		await fireEvent.keyDown(slider, { key: 'ArrowRight' });
		expect(slider).toHaveAttribute('aria-valuenow', '3');
		await fireEvent.keyDown(slider, { key: 'End' });
		expect(slider).toHaveAttribute('aria-valuenow', '5');
		await fireEvent.keyDown(slider, { key: 'Home' });
		expect(slider).toHaveAttribute('aria-valuenow', '0');
		expect(onValueChange).toHaveBeenLastCalledWith(0);
	});

	test('uses half steps when enabled', async () => {
		render(Rating, { value: 1, max: 5, allowHalf: true });
		const slider = screen.getByRole('slider');

		await fireEvent.keyDown(slider, { key: 'ArrowUp' });
		expect(slider).toHaveAttribute('aria-valuenow', '1.5');
	});

	test('mirrors arrow keys and the half-point side in right-to-left text', async () => {
		document.body.style.direction = 'rtl';
		try {
			render(Rating, { value: 2, max: 5, allowHalf: true });
			const slider = screen.getByRole('slider');
			await fireEvent.keyDown(slider, { key: 'ArrowLeft' });
			expect(slider).toHaveAttribute('aria-valuenow', '2.5');
			await fireEvent.keyDown(slider, { key: 'ArrowRight' });
			expect(slider).toHaveAttribute('aria-valuenow', '2');

			const mark = slider.querySelectorAll<HTMLElement>('[data-rating-index]')[3];
			mark.getBoundingClientRect = () => ({ left: 100, width: 24 }) as DOMRect;
			// The right half leads, so it scores the half point.
			await fireEvent.click(mark, { clientX: 120 });
			expect(slider).toHaveAttribute('aria-valuenow', '3.5');
			await fireEvent.click(mark, { clientX: 104 });
			expect(slider).toHaveAttribute('aria-valuenow', '4');
		} finally {
			document.body.style.direction = '';
		}
	});

	test('normalizes max and size boundaries', () => {
		render(Rating, { value: Number.NaN, max: 0, size: -20 });
		const slider = screen.getByRole('slider');

		expect(slider).toHaveAttribute('aria-valuemax', '1');
		expect(slider).toHaveAttribute('aria-valuenow', '0');
		expect(slider.querySelectorAll('[data-rating-index]')).toHaveLength(1);
		expect(slider.querySelector<HTMLElement>('[data-rating-index]')).toHaveStyle({
			width: '8px',
			height: '8px'
		});
	});

	test('removes disabled and readonly ratings from the tab order', async () => {
		const { rerender } = render(Rating, { value: 2, disabled: true });
		const slider = screen.getByRole('slider');

		expect(slider).toHaveAttribute('tabindex', '-1');
		expect(slider).toHaveAttribute('aria-disabled', 'true');
		await fireEvent.keyDown(slider, { key: 'ArrowRight' });
		expect(slider).toHaveAttribute('aria-valuenow', '2');

		await rerender({ value: 2, readonly: true });
		expect(slider).toHaveAttribute('aria-readonly', 'true');
		expect(slider).toHaveAttribute('tabindex', '-1');
	});
});

test('normalizes the drawn icons and recovers keyboard input from NaN', async () => {
	render(Rating, { value: NaN, size: -20 });
	const slider = screen.getByRole('slider');
	expect(slider.querySelector('svg')).toHaveAttribute('width', '8');
	await fireEvent.keyDown(slider, { key: 'ArrowRight' });
	expect(slider).toHaveAttribute('aria-valuenow', '1');
});

describe('Rating motion', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
	const scaleOf = (mark: Element) =>
		Number((mark as HTMLElement).style.transform.match(/scale\(([\d.]+)\)/)?.[1] ?? 1);

	test('previews on hover without changing the committed score', async () => {
		render(Rating, { value: 2, max: 5 });
		const slider = screen.getByRole('slider');
		const marks = slider.querySelectorAll('[data-rating-index]');

		await fireEvent.pointerMove(marks[3], { pointerType: 'mouse' });
		expect(slider).toHaveAttribute('aria-valuenow', '2');
		const fills = () =>
			[...slider.querySelectorAll<HTMLElement>('[data-rating-index] > span')].map(
				(fill) => fill.style.width
			);
		expect(fills()).toEqual(['24px', '24px', '24px', '24px', '0px']);
		expect(slider.querySelector('[data-rating-index] > span svg')).toHaveClass('text-primary/55');

		await fireEvent.pointerLeave(slider);
		expect(fills()).toEqual(['24px', '24px', '0px', '0px', '0px']);
		expect(slider.querySelector('[data-rating-index] > span svg')).toHaveClass('text-primary');
	});

	test('touch skips the preview and commits on tap', async () => {
		const onValueChange = vi.fn();
		render(Rating, { value: 1, onValueChange });
		const slider = screen.getByRole('slider');
		const marks = slider.querySelectorAll('[data-rating-index]');
		await fireEvent.pointerMove(marks[2], { pointerType: 'touch' });
		expect(slider.querySelectorAll<HTMLElement>('[data-rating-index] > span')[2].style.width).toBe(
			'0px'
		);
		await fireEvent.click(marks[2]);
		expect(onValueChange).toHaveBeenCalledWith(3);
	});

	test('pops the chosen mark and echoes back along the row', async () => {
		render(Rating, { value: 0 });
		const slider = screen.getByRole('slider');
		const marks = slider.querySelectorAll('[data-rating-index]');

		await fireEvent.click(marks[3]);
		await advance(16);
		expect(scaleOf(marks[3])).toBeGreaterThan(1.05);
		// The echo has not reached the first mark yet.
		expect(scaleOf(marks[0])).toBe(1);

		await advance(120);
		expect(scaleOf(marks[0])).toBeGreaterThan(1);

		await advance(1500);
		expect([...marks].map((mark) => (mark as HTMLElement).style.transform)).toEqual([
			'',
			'',
			'',
			'',
			''
		]);
	});

	test('keys pop only the mark that lands', async () => {
		render(Rating, { value: 2 });
		const slider = screen.getByRole('slider');
		const marks = slider.querySelectorAll('[data-rating-index]');
		await fireEvent.keyDown(slider, { key: 'ArrowRight' });
		await advance(16);
		expect(scaleOf(marks[2])).toBeGreaterThan(1);
		await advance(200);
		expect(scaleOf(marks[1])).toBe(1);
	});

	test('steps a whole point with Page Up and Page Down', async () => {
		render(Rating, { value: 2, allowHalf: true });
		const slider = screen.getByRole('slider');
		await fireEvent.keyDown(slider, { key: 'PageUp' });
		expect(slider).toHaveAttribute('aria-valuenow', '3');
		await fireEvent.keyDown(slider, { key: 'PageDown' });
		await fireEvent.keyDown(slider, { key: 'PageDown' });
		expect(slider).toHaveAttribute('aria-valuenow', '1');
	});

	test('never pops under reduced motion', async () => {
		vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
		render(Rating, { value: 0 });
		const marks = screen.getByRole('slider').querySelectorAll('[data-rating-index]');
		await fireEvent.click(marks[4]);
		await advance(16);
		expect([...marks].every((mark) => (mark as HTMLElement).style.transform === '')).toBe(true);
	});

	test('cancels pending echoes when destroyed', async () => {
		const { unmount } = render(Rating, { value: 0 });
		await fireEvent.click(screen.getByRole('slider').querySelectorAll('[data-rating-index]')[4]);
		unmount();
		expect(vi.getTimerCount()).toBe(0);
	});
});
