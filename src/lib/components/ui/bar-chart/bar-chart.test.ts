import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';

import BarChart from './bar-chart.svelte';

const data = [
	{ label: 'Mon', value: 4 },
	{ label: 'Tue', value: 6 },
	{ label: 'Wed', value: 2 }
];

function setup(props: Record<string, unknown> = {}) {
	const result = render(BarChart, {
		data,
		label: 'Tokens per day',
		format: (v: number) => `${v}M`,
		unit: 'million tokens',
		...props
	});
	const bars = screen.getAllByRole('img');
	return { ...result, bars };
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('BarChart', () => {
	test('names the chart and every bar with its value and unit', () => {
		const { bars } = setup();
		expect(screen.getByRole('group', { name: 'Tokens per day' })).toBeInTheDocument();
		expect(bars.map((bar) => bar.getAttribute('aria-label'))).toEqual([
			'Mon, 4M million tokens',
			'Tue, 6M million tokens',
			'Wed, 2M million tokens'
		]);
	});

	test('is one tab stop, and the arrow keys move between bars', async () => {
		const { bars } = setup();
		expect(bars.map((bar) => bar.tabIndex)).toEqual([0, -1, -1]);

		bars[0].focus();
		await fireEvent.keyDown(bars[0], { key: 'ArrowRight' });
		expect(document.activeElement).toBe(bars[1]);
		expect(bars.map((bar) => bar.tabIndex)).toEqual([-1, 0, -1]);

		await fireEvent.keyDown(bars[1], { key: 'End' });
		expect(document.activeElement).toBe(bars[2]);
		await fireEvent.keyDown(bars[2], { key: 'ArrowRight' });
		expect(document.activeElement).toBe(bars[2]);
		await fireEvent.keyDown(bars[2], { key: 'Home' });
		expect(document.activeElement).toBe(bars[0]);
	});

	test('shows the readout for the focused bar and dims the rest', async () => {
		const { bars } = setup();
		const readout = (bar: HTMLElement) => bar.querySelector('.shadow-lg') as HTMLElement;
		expect(readout(bars[1])).toHaveClass('opacity-0');

		await fireEvent.focus(bars[1]);
		expect(readout(bars[1])).not.toHaveClass('opacity-0');
		expect(bars[0].firstElementChild).toHaveClass('opacity-40');
		expect(bars[1].firstElementChild).not.toHaveClass('opacity-40');

		await fireEvent.blur(bars[1]);
		expect(readout(bars[1])).toHaveClass('opacity-0');
	});

	test('rounds the scale up and labels the ticks', () => {
		const { container } = setup();
		const labels = Array.from(container.querySelectorAll('.absolute.right-0')).map((tick) =>
			tick.textContent?.trim()
		);
		expect(labels).toEqual(['0M', '5M', '10M']);
	});

	test('grows straight to height under reduced motion', async () => {
		vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
		const { bars } = setup({ max: 8, height: 86 });
		await new Promise((resolve) => setTimeout(resolve, 0));
		const body = bars[0].querySelector('.origin-bottom') as HTMLElement;
		// 4 of 8 fills 43px of 86; the body is that minus the 6px cap over 80px.
		expect(body.style.transform).toBe('scaleY(0.4625)');
	});

	test('a zero max or missing values fall back to a real scale and settle', async () => {
		const frames = vi.fn((callback: FrameRequestCallback) =>
			setTimeout(() => callback(performance.now()), 0)
		);
		vi.stubGlobal('requestAnimationFrame', frames);
		const { bars, container } = setup({
			max: 0,
			data: [
				{ label: 'Mon', value: 0 },
				{ label: 'Tue', value: Number.NaN },
				{ label: 'Wed', value: 0 }
			]
		});
		await new Promise((resolve) => setTimeout(resolve, 200));
		const called = frames.mock.calls.length;
		await new Promise((resolve) => setTimeout(resolve, 50));
		// At rest, the spring loop has stopped asking for frames.
		expect(frames.mock.calls.length).toBe(called);
		for (const bar of bars) {
			const body = bar.querySelector('.origin-bottom') as HTMLElement;
			expect(body.style.transform).toBe('scaleY(0)');
		}
		const ticks = Array.from(container.querySelectorAll('.absolute.right-0')).map((tick) =>
			tick.getAttribute('style')
		);
		expect(ticks.every((style) => !style?.includes('NaN'))).toBe(true);
	});

	test('keeps a tab stop when the data shrinks under the focused bar', async () => {
		const { bars, rerender } = setup();
		await fireEvent.focus(bars[2]);
		expect(bars.map((bar) => bar.tabIndex)).toEqual([-1, -1, 0]);
		await rerender({ data: data.slice(0, 2) });
		const left = screen.getAllByRole('img');
		expect(left.map((bar) => bar.tabIndex)).toEqual([-1, 0]);
	});
});
