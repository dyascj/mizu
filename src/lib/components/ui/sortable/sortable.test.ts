import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';

import Fixture from './sortable.test.svelte';

const items = [
	{ id: 'a', name: 'Plan' },
	{ id: 'b', name: 'Search' },
	{ id: 'c', name: 'Draft' },
	{ id: 'd', name: 'Review' }
];

function setup(layout: 'list' | 'grid' = 'list') {
	const onReorder = vi.fn();
	const result = render(Fixture, { items, layout, onReorder });
	const names = () =>
		screen
			.getAllByRole('listitem')
			.map((li) => li.textContent?.trim())
			.join(' ');
	const live = () => result.container.querySelector('[aria-live="assertive"]')?.textContent;
	return { ...result, onReorder, names, live };
}

const handle = (name: string) => screen.getByRole('button', { name: `Reorder ${name}` });

describe('Sortable', () => {
	test('renders a labelled list with one tab stop and instructions', () => {
		setup();
		expect(screen.getByRole('list', { name: 'Steps' })).toBeInTheDocument();
		expect(handle('Plan')).toHaveAttribute('tabindex', '0');
		expect(handle('Search')).toHaveAttribute('tabindex', '-1');
		expect(handle('Plan')).toHaveAccessibleDescription(/Space to pick up/);
		expect(handle('Plan')).toHaveAttribute('aria-pressed', 'false');
	});

	test('arrows move focus between handles until an item is picked up', async () => {
		setup();
		handle('Plan').focus();
		await fireEvent.keyDown(handle('Plan'), { key: 'ArrowDown' });
		expect(document.activeElement).toBe(handle('Search'));
		expect(handle('Search')).toHaveAttribute('tabindex', '0');
		await fireEvent.keyDown(handle('Search'), { key: 'End' });
		expect(document.activeElement).toBe(handle('Review'));
	});

	test('picks up, moves, and drops from the keyboard, announcing each step', async () => {
		const { onReorder, names, live } = setup();
		const plan = handle('Plan');
		plan.focus();
		await fireEvent.keyDown(plan, { key: ' ' });
		expect(plan).toHaveAttribute('aria-pressed', 'true');
		expect(live()).toMatch(/Picked up Plan, position 1 of 4/);

		await fireEvent.keyDown(plan, { key: 'ArrowDown' });
		await fireEvent.keyDown(handle('Plan'), { key: 'ArrowDown' });
		expect(names()).toBe('Search Draft Plan Review');
		expect(onReorder).toHaveBeenLastCalledWith([items[1], items[2], items[0], items[3]]);
		expect(live()).toBe('Moved Plan to position 3 of 4.');

		await fireEvent.keyDown(handle('Plan'), { key: 'Enter' });
		expect(handle('Plan')).toHaveAttribute('aria-pressed', 'false');
		expect(live()).toBe('Dropped Plan at position 3 of 4.');
	});

	test('Escape puts the item back where it started', async () => {
		const { names, live, onReorder } = setup();
		const draft = handle('Draft');
		draft.focus();
		await fireEvent.keyDown(draft, { key: 'Enter' });
		await fireEvent.keyDown(draft, { key: 'Home' });
		expect(names()).toBe('Draft Plan Search Review');
		await fireEvent.keyDown(handle('Draft'), { key: 'Escape' });
		expect(names()).toBe('Plan Search Draft Review');
		expect(onReorder).toHaveBeenLastCalledWith(items);
		expect(live()).toBe('Cancelled. Draft is back at position 3 of 4.');
	});

	test('a held item is set down when focus leaves it', async () => {
		const { live } = setup();
		const plan = handle('Plan');
		plan.focus();
		await fireEvent.keyDown(plan, { key: ' ' });
		plan.blur();
		await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));
		expect(plan).toHaveAttribute('aria-pressed', 'false');
		expect(live()).toBe('Dropped Plan at position 1 of 4.');
	});

	test('the grid moves in two dimensions and names rows and columns', async () => {
		const { names, live } = setup('grid');
		const tile = screen.getByRole('button', { name: 'Plan, row 1, column 1' });
		tile.focus();
		await fireEvent.keyDown(tile, { key: ' ' });
		await fireEvent.keyDown(tile, { key: 'ArrowDown' });
		expect(names()).toBe('Search Draft Plan Review');
		expect(live()).toBe('Moved Plan to row 2, column 1.');
		await fireEvent.keyDown(tile, { key: 'ArrowRight' });
		expect(names()).toBe('Search Draft Review Plan');
		// Stops at the edge instead of wrapping.
		await fireEvent.keyDown(tile, { key: 'ArrowRight' });
		expect(names()).toBe('Search Draft Review Plan');
	});
});
