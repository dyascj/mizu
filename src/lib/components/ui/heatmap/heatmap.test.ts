import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';

import Heatmap from './heatmap.svelte';

// Two weeks from Sunday, March 1, 2026.
const data = Array.from({ length: 14 }, (_, i) => ({
	date: `2026-03-${String(i + 1).padStart(2, '0')}`,
	count: [0, 1, 4, 7, 10, 2, 0][i % 7]
}));

function setup(props: Record<string, unknown> = {}) {
	const result = render(Heatmap, { data, unit: 'run', locale: 'en-US', ...props });
	const grid = screen.getByRole('grid');
	const cells = screen.getAllByRole('gridcell');
	const tip = () => result.container.querySelector('[data-show]') as HTMLElement;
	return { ...result, grid, cells, tip };
}

describe('Heatmap', () => {
	test('lays days out as seven rows of weeks, each cell naming its count and date', () => {
		const { grid, cells } = setup();
		expect(grid).toHaveAccessibleName('Activity over the last 2 weeks');
		expect(screen.getAllByRole('row')).toHaveLength(7);
		// Row-major: Sundays first.
		expect(cells[0]).toHaveAccessibleName('No runs on Sunday, March 1, 2026');
		expect(cells[1]).toHaveAccessibleName('No runs on Sunday, March 8, 2026');
		expect(cells[2]).toHaveAccessibleName('1 run on Monday, March 2, 2026');
		expect(cells[7]).toHaveAccessibleName('7 runs on Wednesday, March 11, 2026');
	});

	test('buckets counts by the thresholds, or by a given level', () => {
		const { cells } = setup();
		const level = (cell: HTMLElement) => cell.className.match(/bg-primary(\/\d+)?/)?.[0];
		expect(level(cells[0])).toBe('bg-primary/8');
		expect(level(cells[2])).toBe('bg-primary/25');
		expect(level(cells[8])).toBe('bg-primary');
	});

	test('lets pre-bucketed data set its own level', () => {
		const { cells } = setup({ data: [{ date: '2026-03-01', count: 1, level: 4 }] });
		expect(cells[0].className).toMatch(/bg-primary(\s|$)/);
	});

	test('is one tab stop on the newest day, and the arrows move by day and week', async () => {
		const { cells } = setup();
		const byIndex = (i: number) => cells.find((c) => c.dataset.i === String(i)) as HTMLElement;
		expect(cells.filter((c) => c.tabIndex === 0)).toEqual([byIndex(13)]);

		byIndex(13).focus();
		await fireEvent.keyDown(byIndex(13), { key: 'ArrowUp' });
		expect(document.activeElement).toBe(byIndex(12));
		await fireEvent.keyDown(byIndex(12), { key: 'ArrowLeft' });
		expect(document.activeElement).toBe(byIndex(5));
		await fireEvent.keyDown(byIndex(5), { key: 'ArrowLeft' });
		expect(document.activeElement).toBe(byIndex(5));
		await fireEvent.keyDown(byIndex(5), { key: 'End' });
		expect(document.activeElement).toBe(byIndex(12));
		expect(byIndex(12).tabIndex).toBe(0);
		expect(byIndex(13).tabIndex).toBe(-1);
	});

	test('right to left, the weeks mirror and the arrows follow them', async () => {
		document.body.style.direction = 'rtl';
		try {
			const { cells } = setup();
			const byIndex = (i: number) => cells.find((c) => c.dataset.i === String(i)) as HTMLElement;
			byIndex(13).focus();
			await fireEvent.keyDown(byIndex(13), { key: 'ArrowRight' });
			expect(document.activeElement).toBe(byIndex(6));
			await fireEvent.keyDown(byIndex(6), { key: 'ArrowLeft' });
			expect(document.activeElement).toBe(byIndex(13));
		} finally {
			document.body.style.direction = '';
		}
	});

	test('shows a tooltip for the focused day and hides it on Escape', async () => {
		const { cells, tip } = setup();
		await fireEvent.focusIn(cells[2]);
		expect(tip()).toHaveAttribute('data-show', 'true');
		expect(tip()).toHaveTextContent('1 run on Mar 2');
		await fireEvent.keyDown(cells[2], { key: 'Escape' });
		expect(tip()).toHaveAttribute('data-show', 'false');
	});

	test('can drop the legend and rename the grid', () => {
		const { container } = setup({ legend: false, label: 'Agent runs' });
		expect(screen.getByRole('grid')).toHaveAccessibleName('Agent runs');
		expect(container).not.toHaveTextContent('Less');
	});
});
