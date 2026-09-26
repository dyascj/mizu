import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import InlineEdit from './inline-edit.svelte';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const liveRegion = (container: HTMLElement) =>
	container.querySelector('[aria-live="polite"]')?.textContent?.trim();

describe('InlineEdit', () => {
	test('shows the text as a button named for what it edits', () => {
		render(InlineEdit, { label: 'Name', value: 'Research assistant' });
		expect(screen.getByRole('button', { name: 'Edit Name: Research assistant' })).toHaveAttribute(
			'type',
			'button'
		);
	});

	test('shows the placeholder while empty', () => {
		render(InlineEdit, { label: 'Name', value: '', placeholder: 'Name your assistant' });
		expect(
			screen.getByRole('button', { name: 'Edit Name: Name your assistant' })
		).toBeInTheDocument();
	});

	test('Enter saves, announces, and hands focus back to the text', async () => {
		const onSave = vi.fn();
		const { container } = render(InlineEdit, { label: 'Name', value: 'Nova', onSave });
		await fireEvent.click(screen.getByRole('button', { name: /Edit Name/ }));
		const field = screen.getByRole('textbox', { name: 'Name' });
		expect(field).toHaveFocus();
		expect(field).toHaveValue('Nova');

		await fireEvent.input(field, { target: { value: '  Nova   two ' } });
		await fireEvent.keyDown(field, { key: 'Enter' });
		expect(onSave).toHaveBeenCalledWith('Nova two');
		expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
		await act(() => vi.advanceTimersByTimeAsync(0));
		expect(screen.getByRole('button', { name: 'Edit Name: Nova two' })).toHaveFocus();
		expect(liveRegion(container)).toBe('Name saved');

		await act(() => vi.advanceTimersByTimeAsync(1600));
		expect(liveRegion(container)).toBe('');
	});

	test('Escape cancels without saving', async () => {
		const onSave = vi.fn();
		render(InlineEdit, { label: 'Name', value: 'Nova', onSave });
		await fireEvent.click(screen.getByRole('button', { name: /Edit Name/ }));
		const field = screen.getByRole('textbox', { name: 'Name' });
		await fireEvent.input(field, { target: { value: 'Other' } });
		await fireEvent.keyDown(field, { key: 'Escape' });
		expect(onSave).not.toHaveBeenCalled();
		expect(screen.getByRole('button', { name: 'Edit Name: Nova' })).toBeInTheDocument();
	});

	test('leaving the field saves, and an unchanged edit saves nothing', async () => {
		const onSave = vi.fn();
		render(InlineEdit, { label: 'Name', value: 'Nova', onSave });
		await fireEvent.click(screen.getByRole('button', { name: /Edit Name/ }));
		await fireEvent.blur(screen.getByRole('textbox', { name: 'Name' }));
		expect(onSave).not.toHaveBeenCalled();

		await fireEvent.click(screen.getByRole('button', { name: /Edit Name/ }));
		const field = screen.getByRole('textbox', { name: 'Name' });
		await fireEvent.input(field, { target: { value: 'Atlas' } });
		await fireEvent.blur(field);
		expect(onSave).toHaveBeenCalledWith('Atlas');
	});

	test('multiline keeps line breaks, Shift+Enter does not save, Enter does', async () => {
		const onSave = vi.fn();
		render(InlineEdit, { label: 'Instructions', value: 'Be brief.', multiline: true, onSave });
		await fireEvent.click(screen.getByRole('button', { name: /Edit Instructions/ }));
		const field = screen.getByRole('textbox', { name: 'Instructions' });
		expect(field.tagName).toBe('TEXTAREA');
		await fireEvent.input(field, { target: { value: 'Be brief.\nCite sources.' } });
		await fireEvent.keyDown(field, { key: 'Enter', shiftKey: true });
		expect(onSave).not.toHaveBeenCalled();
		await fireEvent.keyDown(field, { key: 'Enter' });
		expect(onSave).toHaveBeenCalledWith('Be brief.\nCite sources.');
	});

	test('disabled does not start editing', async () => {
		render(InlineEdit, { label: 'Name', value: 'Nova', disabled: true });
		await fireEvent.click(screen.getByRole('button', { name: /Edit Name/ }));
		expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
	});

	test('clears its timer when destroyed', async () => {
		const { unmount } = render(InlineEdit, { label: 'Name', value: 'Nova' });
		await fireEvent.click(screen.getByRole('button', { name: /Edit Name/ }));
		await fireEvent.input(screen.getByRole('textbox'), { target: { value: 'Atlas' } });
		await fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
		await vi.advanceTimersByTimeAsync(0);
		unmount();
		expect(vi.getTimerCount()).toBe(0);
	});
});
