import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';

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
