import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import CopyButton from './copy-button.svelte';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

function mockClipboard(clipboard: { writeText: (text: string) => Promise<void> } | undefined) {
	Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard });
}

const liveRegion = (container: HTMLElement) =>
	container.querySelector('[aria-live="polite"]')?.textContent?.trim();

describe('CopyButton', () => {
	test('uses a stable accessible name that defaults to Copy', async () => {
		const { rerender } = render(CopyButton, { value: 'sk-123' });
		expect(screen.getByRole('button', { name: 'Copy' })).toHaveAttribute('type', 'button');
		await rerender({ value: 'sk-123', label: 'Copy API key' });
		expect(screen.getByRole('button', { name: 'Copy API key' })).toBeInTheDocument();
	});

	test('copies the value, reports it, announces success, and resets', async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		mockClipboard({ writeText });
		const onCopy = vi.fn();
		const { container } = render(CopyButton, { value: 'sk-123', onCopy, timeout: 1000 });
		const button = screen.getByRole('button', { name: 'Copy' });

		await fireEvent.click(button);
		expect(writeText).toHaveBeenCalledWith('sk-123');
		expect(onCopy).toHaveBeenCalledWith('sk-123');
		expect(button).toHaveAttribute('data-status', 'copied');
		expect(liveRegion(container)).toBe('Copied');
		expect(button).toHaveAccessibleName('Copy');

		await act(() => vi.advanceTimersByTimeAsync(1000));
		expect(button).toHaveAttribute('data-status', 'idle');
		expect(liveRegion(container)).toBe('');
	});

	test('shows and announces a failure when the clipboard rejects', async () => {
		mockClipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) });
		const onCopy = vi.fn();
		const { container } = render(CopyButton, { value: 'sk-123', onCopy });
		const button = screen.getByRole('button', { name: 'Copy' });

		await fireEvent.click(button);
		expect(button).toHaveAttribute('data-status', 'error');
		expect(liveRegion(container)).toBe('Copy failed');
		expect(onCopy).not.toHaveBeenCalled();
	});

	test('fails gracefully when the clipboard API is unavailable', async () => {
		mockClipboard(undefined);
		const { container } = render(CopyButton, { value: 'sk-123' });

		await fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
		expect(liveRegion(container)).toBe('Copy failed');
	});

	test('restarts the success window on repeated copies', async () => {
		mockClipboard({ writeText: vi.fn().mockResolvedValue(undefined) });
		render(CopyButton, { value: 'sk-123', timeout: 1000 });
		const button = screen.getByRole('button', { name: 'Copy' });

		await fireEvent.click(button);
		await act(() => vi.advanceTimersByTimeAsync(800));
		await fireEvent.click(button);
		await act(() => vi.advanceTimersByTimeAsync(800));
		expect(button).toHaveAttribute('data-status', 'copied');
		await act(() => vi.advanceTimersByTimeAsync(200));
		expect(button).toHaveAttribute('data-status', 'idle');
	});

	test('clears its reset timer when destroyed', async () => {
		mockClipboard({ writeText: vi.fn().mockResolvedValue(undefined) });
		const { unmount } = render(CopyButton, { value: 'sk-123' });

		await fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
		// Flush Svelte's own zero-delay timer so only the component's timer remains.
		await vi.advanceTimersByTimeAsync(0);
		unmount();
		expect(vi.getTimerCount()).toBe(0);
	});
});
