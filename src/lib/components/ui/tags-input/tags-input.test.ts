import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';

import TagsInput from './tags-input.svelte';

describe('TagsInput', () => {
	test('adds, deduplicates, removes, and reports tags from the keyboard', async () => {
		const onValueChange = vi.fn();
		render(TagsInput, { value: ['one'], onValueChange });
		const input = screen.getByRole('textbox', { name: 'Add a tag' });

		await fireEvent.input(input, { target: { value: 'two' } });
		await fireEvent.keyDown(input, { key: 'Enter' });
		expect(onValueChange).toHaveBeenLastCalledWith(['one', 'two']);

		await fireEvent.input(input, { target: { value: 'two' } });
		await fireEvent.keyDown(input, { key: ',' });
		expect(onValueChange).toHaveBeenCalledTimes(1);

		await fireEvent.input(input, { target: { value: '' } });
		await fireEvent.keyDown(input, { key: 'Backspace' });
		expect(onValueChange).toHaveBeenLastCalledWith(['one']);
	});

	test('normalizes the maximum and honors validation', async () => {
		const onValueChange = vi.fn();
		const validate = (tag: string) => tag.startsWith('m');
		render(TagsInput, { value: [], max: 1.4, validate, onValueChange });
		const input = screen.getByRole('textbox', { name: 'Add a tag' });

		await fireEvent.input(input, { target: { value: 'other' } });
		await fireEvent.keyDown(input, { key: 'Enter' });
		expect(onValueChange).not.toHaveBeenCalled();

		await fireEvent.input(input, { target: { value: 'mizu' } });
		await fireEvent.keyDown(input, { key: 'Enter' });
		expect(onValueChange).toHaveBeenCalledWith(['mizu']);
		expect(input).toHaveAttribute('readonly');
	});
});

test('does not commit a tag during IME composition', async () => {
	const onValueChange = vi.fn();
	render(TagsInput, { onValueChange });
	const input = screen.getByRole('textbox');
	await fireEvent.input(input, { target: { value: '日本語' } });
	await fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
	expect(onValueChange).not.toHaveBeenCalled();
	expect(input).toHaveValue('日本語');
});
