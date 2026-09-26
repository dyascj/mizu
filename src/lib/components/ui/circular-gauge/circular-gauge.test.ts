import { act, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import CircularGauge from './circular-gauge.svelte';

describe('CircularGauge', () => {
	test('clamps value and geometry to valid meter output', () => {
		render(CircularGauge, { value: Number.NaN, size: -20, strokeWidth: 100 });
		const meter = screen.getByRole('meter', { name: 'Progress' });
		const svg = meter.querySelector('svg');
		const circles = meter.querySelectorAll('circle');

		expect(meter).toHaveAttribute('aria-valuenow', '0');
		expect(meter.textContent?.trim()).toBe('');
		expect(meter).toHaveStyle({ width: '16px', height: '16px' });
		expect(svg).toHaveAttribute('width', '16');
		expect(circles[0]).toHaveAttribute('r', '4');
		expect(circles[0]).toHaveAttribute('stroke-width', '8');
	});

	test('uses the primary token for the progress treatment', () => {
		const { container } = render(CircularGauge, { value: 50 });
		const markup = container.innerHTML;

		expect(markup).toContain('var(--primary)');
		expect(markup).not.toMatch(/#(?:5cd5ff|0090d9)|rgba\(1,178,255/);
	});
});

describe('CircularGauge motion', () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});
	const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
	const litTicks = (meter: HTMLElement) => meter.querySelectorAll('line[data-lit="true"]').length;

	test('sweeps the dial in, lighting ticks and counting the number with it', async () => {
		render(CircularGauge, { value: 50, variant: 'ticks', label: 'Context used' });
		const meter = screen.getByRole('meter', { name: 'Context used' });
		expect(meter).toHaveAttribute('aria-valuenow', '50');
		expect(meter.querySelectorAll('g line')).toHaveLength(41);

		await advance(50);
		const early = litTicks(meter);
		expect(early).toBeLessThan(21);
		await advance(2000);
		expect(litTicks(meter)).toBe(21);
		expect(meter).toHaveTextContent('50%');
	});

	test('holds a peak marker after a drop, then lets it fall', async () => {
		const { rerender } = render(CircularGauge, { value: 80, variant: 'ticks', label: 'Load' });
		await advance(2000);
		const marker = () => screen.getByRole('meter').querySelector<SVGLineElement>('svg > line');
		expect(Number(marker()?.style.opacity)).toBe(0);

		await rerender({ value: 30, variant: 'ticks', label: 'Load' });
		await advance(700);
		expect(Number(marker()?.style.opacity)).toBe(1);
		await advance(2000);
		expect(Number(marker()?.style.opacity)).toBe(0);
	});

	test('names a reading past the threshold in words, not only color', async () => {
		render(CircularGauge, { value: 91, variant: 'ticks', label: 'Tokens', threshold: 85 });
		const meter = screen.getByRole('meter', { name: 'Tokens' });
		expect(meter).toHaveAttribute('aria-valuetext', '91%, high');
		expect(meter).toHaveTextContent('High');
		expect(meter.querySelectorAll('line.stroke-destructive\\/25')).toHaveLength(6);
	});

	test('jumps straight to the value under reduced motion', async () => {
		vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
		render(CircularGauge, { value: 64, label: 'Focus' });
		await advance(0);
		expect(screen.getByRole('meter')).toHaveTextContent('64');
	});

	test('stops its loops and timers when destroyed', async () => {
		const { rerender, unmount } = render(CircularGauge, { value: 90, variant: 'ticks' });
		await advance(1000);
		await rerender({ value: 20, variant: 'ticks' });
		await advance(16);
		unmount();
		expect(vi.getTimerCount()).toBe(0);
	});
	test('lights the dial again after switching away and back', async () => {
		const { rerender } = render(CircularGauge, { value: 10, variant: 'ticks' });
		await rerender({ value: 50, variant: 'ticks' });
		await advance(2000);
		await rerender({ value: 50, variant: 'ring' });
		await rerender({ value: 50, variant: 'ticks' });
		await advance(50);
		expect(litTicks(screen.getByRole('meter'))).toBe(21);
	});

	test('shows the reading at once under reduced motion', () => {
		vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
		render(CircularGauge, { value: 64 });
		expect(screen.getByRole('meter')).toHaveTextContent('64');
	});
});
