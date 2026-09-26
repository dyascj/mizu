import { act, fireEvent, render, screen, within } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import * as DataTable from './index.js';
import Fixture from './data-table.test.svelte';

const nativeAnimate = Element.prototype.animate;

beforeEach(() => {
	// Removed rows fade out through a Svelte transition, which jsdom cannot run.
	Element.prototype.animate = function () {
		const animation = {
			cancel() {},
			currentTime: 0,
			playState: 'finished',
			onfinish: null as null | (() => void)
		};
		queueMicrotask(() => animation.onfinish?.());
		return animation as unknown as Animation;
	};
});

afterEach(() => {
	Element.prototype.animate = nativeAnimate;
	vi.useRealTimers();
});

const tasks = () =>
	screen
		.getAllByRole('row')
		.slice(1)
		.map((row) => within(row).getAllByRole('cell')[0].textContent);
const textSnippet = (text: string) =>
	createRawSnippet(() => ({ render: () => `<span>${text}</span>` }));
const flush = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

describe('DataTable', () => {
	test('keeps the TanStack adapter exports', () => {
		expect(DataTable.createSvelteTable).toBeTypeOf('function');
		expect(DataTable.FlexRender).toBeDefined();
		expect(DataTable.renderComponent).toBeTypeOf('function');
		expect(DataTable.renderSnippet).toBeTypeOf('function');
	});

	test('the sort button sorts and keeps aria-sort on its header cell', async () => {
		render(Fixture);
		const button = screen.getByRole('button', { name: 'Tokens' });
		const cell = button.closest('th')!;
		await flush();
		expect(cell).toHaveAttribute('aria-sort', 'none');

		await fireEvent.click(button);
		await flush();
		expect(cell).toHaveAttribute('aria-sort', 'ascending');
		expect(tasks()).toEqual(['Inbox digest', 'Trip itinerary', 'Blog draft']);

		await fireEvent.click(button);
		await flush();
		expect(cell).toHaveAttribute('aria-sort', 'descending');
		expect(tasks()).toEqual(['Blog draft', 'Trip itinerary', 'Inbox digest']);
	});

	test('rows select on click, but not through the controls inside them', async () => {
		render(Fixture);
		const row = screen.getAllByRole('row')[1];
		await fireEvent.click(screen.getByRole('button', { name: 'Open Blog draft' }));
		expect(row).not.toHaveAttribute('data-state');
		await fireEvent.click(within(row).getAllByRole('cell')[0]);
		expect(row).toHaveAttribute('data-state', 'selected');
	});

	test('the bulk bar opens with the selection, announces it, and Escape clears it', async () => {
		const { container } = render(Fixture);
		const bar = screen.getByRole('toolbar', { hidden: true });
		expect(bar).toHaveAttribute('data-state', 'closed');
		expect(bar).toHaveAttribute('aria-label', 'Bulk actions');

		const [, first, second] = screen.getAllByRole('row');
		await fireEvent.click(within(first).getAllByRole('cell')[0]);
		await fireEvent.click(within(second).getAllByRole('cell')[0]);
		expect(bar).toHaveAttribute('data-state', 'open');
		expect(bar).toHaveTextContent('2 selected');
		const live = [...container.querySelectorAll('[aria-live="polite"]')];
		expect(live.some((node) => node.textContent === '2 selected')).toBe(true);

		await fireEvent.keyDown(first, { key: 'Escape' });
		expect(bar).toHaveAttribute('data-state', 'closed');
		// Holds the last count while it slides away, so it never reads zero.
		expect(bar).toHaveTextContent('2 selected');
	});

	test('the clear button empties the selection', async () => {
		render(Fixture);
		await fireEvent.click(within(screen.getAllByRole('row')[1]).getAllByRole('cell')[0]);
		await fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
		expect(screen.getByRole('toolbar', { hidden: true })).toHaveAttribute('data-state', 'closed');
	});

	test('a bulk action with a done label confirms and announces, then resets', async () => {
		vi.useFakeTimers();
		const onExport = vi.fn();
		const { container } = render(Fixture, { onExport });
		await fireEvent.click(within(screen.getAllByRole('row')[1]).getAllByRole('cell')[0]);
		await fireEvent.click(screen.getByRole('button', { name: 'Export' }));
		expect(onExport).toHaveBeenCalledTimes(1);
		const live = () =>
			[...container.querySelectorAll('[aria-live="polite"]')].map((node) => node.textContent);
		expect(live()).toContain('Exported');
		await act(() => vi.advanceTimersByTimeAsync(2500));
		expect(live()).not.toContain('Exported');
	});

	test('closing the bar hands focus back instead of dropping it', async () => {
		render(Fixture);
		const bar = screen.getByRole('toolbar', { hidden: true });
		await fireEvent.click(within(screen.getAllByRole('row')[1]).getAllByRole('cell')[0]);
		const origin = screen.getByRole('button', { name: 'Open Trip itinerary' });
		origin.focus();
		const remove = screen.getByRole('button', { name: 'Delete' });
		remove.focus();
		await fireEvent.click(remove);
		await flush();
		await flush();
		expect(bar).toHaveAttribute('data-state', 'closed');
		expect(document.activeElement).toBe(origin);
	});

	test('with nowhere to return to, focus lands on the first control around the bar', async () => {
		render(Fixture);
		await fireEvent.click(within(screen.getAllByRole('row')[1]).getAllByRole('cell')[0]);
		const clear = screen.getByRole('button', { name: 'Clear selection' });
		clear.focus();
		await fireEvent.click(clear);
		await flush();
		expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Task' }));
	});

	test('the sort button calls a caller onclick, which can cancel the sort', async () => {
		const onclick = vi.fn();
		const cancel = vi.fn((event: MouseEvent) => event.preventDefault());
		const column = {
			getIsSorted: () => false as const,
			getToggleSortingHandler: () => toggle
		};
		const toggle = vi.fn();
		const { rerender } = render(DataTable.DataTableSortButton, {
			column,
			onclick,
			children: textSnippet('Tokens')
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Tokens' }));
		expect(onclick).toHaveBeenCalledOnce();
		expect(toggle).toHaveBeenCalledOnce();
		await rerender({ onclick: cancel });
		await fireEvent.click(screen.getByRole('button', { name: 'Tokens' }));
		expect(cancel).toHaveBeenCalledOnce();
		expect(toggle).toHaveBeenCalledOnce();
	});

	test('deleting selected rows removes them from the body', async () => {
		render(Fixture);
		await fireEvent.click(within(screen.getAllByRole('row')[1]).getAllByRole('cell')[0]);
		await fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
		await flush();
		await flush();
		expect(tasks()).toEqual(['Inbox digest', 'Trip itinerary']);
	});
});
