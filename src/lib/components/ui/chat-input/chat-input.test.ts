import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';

import ChatInput from './chat-input.svelte';

describe('ChatInput', () => {
	test('submits trimmed content and clears the controlled input', async () => {
		const onSubmit = vi.fn();
		render(ChatInput, { value: '  hello  ', onSubmit });
		const input = screen.getByRole('textbox');

		await fireEvent.submit(input.closest('form')!);
		expect(onSubmit).toHaveBeenCalledWith('hello');
		expect(input).toHaveValue('');
	});

	test('does not submit blank or disabled messages', async () => {
		const onSubmit = vi.fn();
		const { rerender } = render(ChatInput, { value: '   ', onSubmit });
		const form = screen.getByRole('textbox').closest('form')!;

		await fireEvent.submit(form);
		await rerender({ value: 'hello', disabled: true, onSubmit });
		await fireEvent.submit(form);
		expect(onSubmit).not.toHaveBeenCalled();
	});
});

test('composition Enter does not submit and optional actions are wired', async () => {
	const onAttach = vi.fn();
	const onVoice = vi.fn();
	const { rerender } = render(ChatInput, { value: '日本語' });
	expect(screen.queryByRole('button', { name: 'Attach' })).toBeNull();
	const input = screen.getByRole('textbox', { name: 'Message' });
	const event = new KeyboardEvent('keydown', {
		key: 'Enter',
		isComposing: true,
		bubbles: true,
		cancelable: true
	});
	await fireEvent(input, event);
	expect(event.defaultPrevented).toBe(true);
	expect(input).toHaveValue('日本語');
	await rerender({ onAttach, onVoice });
	await fireEvent.click(screen.getByRole('button', { name: 'Attach' }));
	await fireEvent.click(screen.getByRole('button', { name: 'Voice input' }));
	expect(onAttach).toHaveBeenCalledOnce();
	expect(onVoice).toHaveBeenCalledOnce();
});
