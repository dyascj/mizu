import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, expect, test, vi } from 'vitest';
import Toast from './toast.svelte';
import { toast, toaster } from './toast-state.svelte';

afterEach(() => {
	toaster.clear();
	vi.useRealTimers();
});

test('keyboard focus pauses dismissal, including when the pointer leaves', async () => {
	vi.useFakeTimers();
	toast({ title: 'Archived', duration: 1000, action: { label: 'Undo', onclick: vi.fn() } });
	render(Toast, { toast: toaster.toasts[0] });
	const status = screen.getByRole('status');
	const undo = screen.getByRole('button', { name: 'Undo' });
	await act(() => vi.advanceTimersByTimeAsync(250));
	await fireEvent.focusIn(undo);
	await fireEvent.pointerEnter(status);
	await fireEvent.pointerLeave(status);
	await act(() => vi.advanceTimersByTimeAsync(2000));
	expect(toaster.toasts).toHaveLength(1);
	await fireEvent.focusOut(undo, { relatedTarget: document.body });
	await act(() => vi.advanceTimersByTimeAsync(749));
	expect(toaster.toasts).toHaveLength(1);
	await act(() => vi.advanceTimersByTimeAsync(1));
	expect(toaster.toasts).toHaveLength(0);
});
