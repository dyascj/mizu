import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';

import Sparkline from './sparkline.svelte';

const data = [
	{ label: 'Mon', value: 420 },
	{ label: 'Tue', value: 380 },
	{ label: 'Wed', value: 450 },
	{ label: 'Thu', value: 400 }
];

function setup(props: Record<string, unknown> = {}) {
	const result = render(Sparkline, {
		data,
		label: 'Time to first token',
		format: (v: number) => `${v} ms`,
		...props
	});
	const chart = screen.getByRole('group', { name: /Time to first token, 4 points/ });
	const live = result.container.querySelector('[aria-live="polite"]') as HTMLElement;
	return { ...result, chart, live };
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('Sparkline', () => {
	test('summarizes the newest value and the change since the first point', () => {
		setup();
		expect(screen.getAllByText('400 ms').length).toBeGreaterThan(0);
		expect(screen.getByText('−20 ms')).toBeInTheDocument();
		expect(screen.getByText(/vs Mon/)).toBeInTheDocument();
	});

	test('hides the summary on request', () => {
		setup({ summary: false });
		expect(screen.queryByText(/vs Mon/)).not.toBeInTheDocument();
	});

	test('exposes every point in a data table', () => {
		setup();
		const table = screen.getByRole('table', { name: 'Time to first token' });
		const rows = table.querySelectorAll('tbody tr');
		expect(rows).toHaveLength(4);
		expect(rows[2].textContent).toContain('Wed');
		expect(rows[2].textContent).toContain('450 ms');
	});

	test('is one tab stop described as a line chart', () => {
		const { chart } = setup();
		expect(chart).toHaveAttribute('tabindex', '0');
		expect(chart).toHaveAttribute('aria-roledescription', 'line chart');
	});

	test('reads the newest point on focus, then steps with the arrow keys', async () => {
		const { chart, live } = setup();
		await fireEvent.focus(chart);
		expect(live.textContent).toBe('Thu: 400 ms');

		await fireEvent.keyDown(chart, { key: 'ArrowLeft' });
		expect(live.textContent).toBe('Wed: 450 ms');
		await fireEvent.keyDown(chart, { key: 'Home' });
		expect(live.textContent).toBe('Mon: 420 ms');
		await fireEvent.keyDown(chart, { key: 'ArrowLeft' });
		expect(live.textContent).toBe('Mon: 420 ms');
		await fireEvent.keyDown(chart, { key: 'End' });
		expect(live.textContent).toBe('Thu: 400 ms');
	});

	test('scrubs to the point nearest the pointer', async () => {
		const { chart, container } = setup();
		chart.getBoundingClientRect = () => DOMRect.fromRect({ x: 0, y: 0, width: 520, height: 160 });
		await fireEvent.pointerMove(chart, { clientX: 180, pointerType: 'mouse' });
		const readout = container.querySelector('.rounded-full.shadow-lg');
		expect(readout?.textContent).toContain('380 ms');
		expect(readout?.textContent).toContain('Tue');
	});

	test('draws immediately under reduced motion', () => {
		vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
		const { container } = setup();
		const line = container.querySelector('path[pathLength]');
		expect(line).toHaveAttribute('stroke-dashoffset', '0');
	});
});
