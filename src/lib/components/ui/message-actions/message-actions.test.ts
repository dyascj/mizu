import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';

import MessageActions from './message-actions.svelte';

afterEach(() => {
	vi.useRealTimers();
});

function mockClipboard(writeText: (text: string) => Promise<void>) {
	Object.defineProperty(navigator, 'clipboard', {
		configurable: true,
		value: { writeText }
	});
}

describe('MessageActions', () => {
	test('announces copy success and clears its teardown timer', async () => {
		vi.useFakeTimers();
		const writeText = vi.fn().mockResolvedValue(undefined);
		mockClipboard(writeText);
		const { unmount } = render(MessageActions, { text: 'Copy me' });

		await fireEvent.click(screen.getByRole('button', { name: 'Copy message' }));
		expect(writeText).toHaveBeenCalledWith('Copy me');
		expect(screen.getByRole('button', { name: 'Message copied' })).toBeInTheDocument();
		expect(screen.getByText('Message copied')).toHaveAttribute('aria-live', 'polite');

		// Flush Svelte's own zero-delay event-propagation timer so only the component's timer remains.
		await vi.advanceTimersByTimeAsync(0);
		unmount();
		expect(vi.getTimerCount()).toBe(0);
	});

	test('shows an accessible failure state when clipboard access rejects', async () => {
		vi.useFakeTimers();
		mockClipboard(vi.fn().mockRejectedValue(new Error('denied')));
		render(MessageActions, { text: 'Copy me' });

		await fireEvent.click(screen.getByRole('button', { name: 'Copy message' }));
		expect(screen.getByRole('button', { name: 'Copy failed, try again' })).toBeInTheDocument();
		expect(screen.getByText('Copy failed')).toHaveAttribute('aria-live', 'polite');

		await act(() => vi.advanceTimersByTimeAsync(1600));
		expect(screen.getByRole('button', { name: 'Copy message' })).toBeInTheDocument();
	});

	test('reports both feedback votes and clearing a vote', async () => {
		const onFeedback = vi.fn();
		render(MessageActions, { onFeedback });
		const good = screen.getByRole('button', { name: 'Good response' });

		await fireEvent.click(good);
		expect(good).toHaveAttribute('aria-pressed', 'true');
		expect(onFeedback).toHaveBeenCalledWith('up');
		await fireEvent.click(good);
		expect(good).toHaveAttribute('aria-pressed', 'false');
		expect(onFeedback).toHaveBeenLastCalledWith(null);
		expect(onFeedback).toHaveBeenCalledTimes(2);
	});
});
