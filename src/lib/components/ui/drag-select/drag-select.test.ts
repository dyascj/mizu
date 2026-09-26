import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';

import Fixture from './drag-select.test.svelte';

function setup() {
	const onSelectionChange = vi.fn();
	const result = render(Fixture, { onSelectionChange });
	const listbox = screen.getByRole('listbox', { name: 'Sources' });
	const option = (name: string) => screen.getByRole('option', { name });
	const picked = () =>
		screen
			.getAllByRole('option')
			.filter((el) => el.getAttribute('aria-selected') === 'true')
			.map((el) => el.textContent?.trim());
	return { ...result, listbox, option, picked, onSelectionChange };
}

describe('DragSelect', () => {
	test('is a labelled multi-select listbox with one tab stop', () => {
		const { listbox, option } = setup();
		expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
		expect(listbox).toHaveAccessibleDescription(/Drag across items/);
		expect(option('Roadmap')).toHaveAttribute('tabindex', '0');
		expect(option('Pricing')).toHaveAttribute('tabindex', '-1');
		expect(option('Roadmap')).toHaveAttribute('aria-selected', 'false');
	});

	test('clicks select one, Control toggles, and Shift selects a range', async () => {
		const { option, picked, onSelectionChange } = setup();
		await fireEvent.click(option('Pricing'));
		expect(picked()).toEqual(['Pricing']);
		expect(onSelectionChange).toHaveBeenLastCalledWith(['pricing']);
		await fireEvent.click(option('Notes'), { ctrlKey: true });
		expect(picked()).toEqual(['Pricing', 'Notes']);
		await fireEvent.click(option('Survey'), { shiftKey: true });
		expect(picked()).toEqual(['Survey', 'Notes']);
	});

	test('the keyboard moves, toggles, extends, selects all, and clears', async () => {
		const { listbox, option, picked } = setup();
		option('Roadmap').focus();
		await fireEvent.keyDown(listbox, { key: ' ' });
		expect(picked()).toEqual(['Roadmap']);
		// jsdom lays every tile at the same top, so the arrows walk one row.
		await fireEvent.keyDown(listbox, { key: 'ArrowRight', shiftKey: true });
		await fireEvent.keyDown(listbox, { key: 'ArrowRight', shiftKey: true });
		expect(picked()).toEqual(['Roadmap', 'Pricing', 'Brief']);
		expect(document.activeElement).toBe(option('Brief'));
		await fireEvent.keyDown(listbox, { key: 'a', ctrlKey: true });
		expect(picked()).toHaveLength(5);
		await fireEvent.keyDown(listbox, { key: 'Escape' });
		expect(picked()).toEqual([]);
	});

	test('announces the count and swaps Select all for Clear', async () => {
		const { container, picked } = setup();
		const live = container.querySelector('[aria-live="polite"]');
		expect(live).toHaveTextContent('0 selected');
		await fireEvent.click(screen.getByRole('button', { name: 'Select all' }));
		expect(picked()).toHaveLength(5);
		expect(live).toHaveTextContent('5 selected');
		await fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
		expect(picked()).toEqual([]);
	});

	test('a click on empty space clears the selection', async () => {
		const { option, picked, listbox } = setup();
		await fireEvent.click(option('Brief'));
		const content = listbox.parentElement!;
		await fireEvent.pointerDown(content, { button: 0, pointerId: 1, pointerType: 'mouse' });
		await fireEvent.pointerUp(content, { pointerId: 1 });
		expect(picked()).toEqual([]);
	});

	test('follows the bound selection', async () => {
		const { rerender, picked } = setup();
		await rerender({ selected: ['notes', 'brief'] });
		expect(picked()).toEqual(['Brief', 'Notes']);
	});

	test('keeps a tab stop when the list shrinks under the focused option', async () => {
		const { option, rerender } = setup();
		await fireEvent.focus(option('Notes'));
		expect(option('Notes')).toHaveAttribute('tabindex', '0');
		await rerender({ count: 3 });
		expect(option('Brief')).toHaveAttribute('tabindex', '0');
		expect(screen.getAllByRole('option').filter((el) => el.tabIndex === 0)).toHaveLength(1);
	});
});
