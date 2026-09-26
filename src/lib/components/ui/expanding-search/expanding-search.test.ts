import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';

import ExpandingSearch from './expanding-search.svelte';

function setup(props: Record<string, unknown> = {}) {
	const onOpenChange = vi.fn();
	const onSearch = vi.fn();
	const result = render(ExpandingSearch, { onOpenChange, onSearch, ...props });
	const trigger = screen.getByRole('button', { name: 'Search', hidden: true });
	const input = result.container.querySelector('input')!;
	return { ...result, onOpenChange, onSearch, trigger, input };
}

describe('ExpandingSearch', () => {
	test('opens from the button into a focused field', async () => {
		const { trigger, input, onOpenChange, container } = setup();
		expect(screen.getByRole('search')).toBeInTheDocument();
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
		expect(trigger).toHaveAttribute('aria-controls', input.id);
		expect(trigger).toHaveAttribute('aria-keyshortcuts', '/');
		expect(input).toHaveClass('invisible');

		await fireEvent.click(trigger);
		expect(onOpenChange).toHaveBeenCalledWith(true);
		expect(trigger).toHaveAttribute('aria-expanded', 'true');
		expect(input).not.toHaveClass('invisible');
		expect(document.activeElement).toBe(input);
		expect(container.querySelector('form')).toHaveAttribute('data-open');
		expect(screen.getByRole('searchbox', { name: 'Search' })).toBe(input);
	});

	test('submits the query with Enter', async () => {
		const { trigger, input, onSearch } = setup();
		await fireEvent.click(trigger);
		await fireEvent.input(input, { target: { value: 'retrieval agents' } });
		await fireEvent.submit(screen.getByRole('search'));
		expect(onSearch).toHaveBeenCalledWith('retrieval agents');
	});

	test('offers a clear button only while there is a query', async () => {
		const { trigger, input } = setup();
		const clear = screen.getByRole<HTMLButtonElement>('button', {
			name: 'Clear search',
			hidden: true
		});
		await fireEvent.click(trigger);
		expect(clear.inert).toBe(true);

		await fireEvent.input(input, { target: { value: 'evals' } });
		expect(clear.inert).toBe(false);
		await fireEvent.click(clear);
		expect(input).toHaveValue('');
		expect(document.activeElement).toBe(input);
	});

	test('Escape closes, clears, and hands focus back to the button', async () => {
		const { trigger, input, onOpenChange } = setup();
		await fireEvent.click(trigger);
		await fireEvent.input(input, { target: { value: 'evals' } });
		await fireEvent.keyDown(input, { key: 'Escape' });
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		expect(input).toHaveValue('');
		expect(document.activeElement).toBe(trigger);
	});

	test('closes when focus leaves an empty field, and stays open with a query', async () => {
		const { trigger, input } = setup();
		await fireEvent.click(trigger);
		await fireEvent.input(input, { target: { value: 'evals' } });
		await fireEvent.focusOut(input, { relatedTarget: document.body });
		expect(trigger).toHaveAttribute('aria-expanded', 'true');

		await fireEvent.input(input, { target: { value: '' } });
		await fireEvent.focusOut(input, { relatedTarget: document.body });
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	test('opens with its shortcut, unless focus is in another field', async () => {
		const { trigger, input } = setup();
		const other = document.createElement('input');
		document.body.append(other);

		await fireEvent.keyDown(other, { key: '/' });
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
		await fireEvent.keyDown(document.body, { key: '/', metaKey: true });
		expect(trigger).toHaveAttribute('aria-expanded', 'false');

		await fireEvent.keyDown(document.body, { key: '/' });
		expect(trigger).toHaveAttribute('aria-expanded', 'true');
		expect(document.activeElement).toBe(input);
		other.remove();
	});

	test('the shortcut can be turned off', async () => {
		const { trigger } = setup({ shortcut: null });
		expect(trigger).not.toHaveAttribute('aria-keyshortcuts');
		await fireEvent.keyDown(document.body, { key: '/' });
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	test('reserves the open width so neighbours never move', () => {
		const { container } = setup({ width: 240 });
		expect(container.firstElementChild).toHaveStyle({ width: '240px' });
	});
});
