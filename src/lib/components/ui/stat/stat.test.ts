import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Stat from './stat.svelte';

beforeEach(() => {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: query.includes('reduce'),
		media: query,
		addEventListener() {},
		removeEventListener() {}
	}));
});

afterEach(() => {
	vi.unstubAllGlobals();
});

const series = [380, 410, 395, 420];

function setup(props: Record<string, unknown> = {}) {
	const result = render(Stat, {
		label: 'Latency',
		value: 420,
		format: { style: 'unit', unit: 'millisecond' },
		locale: 'en-US',
		trend: 0.063,
		goodWhen: 'down',
		series,
		...props
	});
	return result;
}

describe('Stat', () => {
	test('pairs the label with the value and trend in a description list', () => {
		const { container } = setup();
		expect(container.querySelector('dt')).toHaveTextContent('Latency');
		expect(container.querySelector('dd .sr-only')).toHaveTextContent('420 ms, +6.3%');
	});

	test('marks a trend in the bad direction as destructive', async () => {
		const { container, rerender } = setup();
		const chip = () => container.querySelector('.text-destructive');
		expect(chip()).toHaveTextContent('+6.3%');
		await rerender({ goodWhen: 'up' });
		expect(chip()).toBeNull();
	});

	test('the history is a slider that reads past figures by day', async () => {
		setup();
		const slider = screen.getByRole('slider', { name: 'Latency history' });
		expect(slider).toHaveAttribute('aria-valuemax', '3');
		expect(slider).toHaveAttribute('aria-valuenow', '3');
		expect(slider).toHaveAttribute('aria-valuetext', '420 ms, Today');

		await fireEvent.keyDown(slider, { key: 'ArrowLeft' });
		expect(slider).toHaveAttribute('aria-valuenow', '2');
		expect(slider).toHaveAttribute('aria-valuetext', '395 ms, Yesterday');

		await fireEvent.keyDown(slider, { key: 'Home' });
		expect(slider).toHaveAttribute('aria-valuetext', '380 ms, 3 days ago');

		await fireEvent.keyDown(slider, { key: 'Escape' });
		expect(slider).toHaveAttribute('aria-valuetext', '420 ms, Today');
	});

	test('scrubs with the pointer and returns to now when it leaves', async () => {
		setup({ labels: ['Mon', 'Tue', 'Wed', 'Thu'] });
		const slider = screen.getByRole('slider');
		slider.getBoundingClientRect = () => DOMRect.fromRect({ x: 0, y: 0, width: 90, height: 40 });

		await fireEvent.pointerMove(slider, { clientX: 30, pointerType: 'mouse' });
		expect(slider).toHaveAttribute('aria-valuetext', '410 ms, Tue');
		await fireEvent.pointerLeave(slider, { pointerType: 'mouse' });
		expect(slider).toHaveAttribute('aria-valuetext', '420 ms, Thu');
	});

	test('leaves out the trend chip and slider when there is nothing to show', () => {
		const { container } = setup({ trend: undefined, series: undefined });
		expect(screen.queryByRole('slider')).toBeNull();
		expect(container.querySelector('dd .sr-only')).toHaveTextContent(/^420 ms$/);
	});
});
