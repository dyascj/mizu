import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import CopyButton from './copy-button.svelte';

// jsdom has no Web Animations API; Svelte transitions finish on the next microtask.
const nativeAnimate = Element.prototype.animate;
function fakeAnimate() {
	return {
		cancel() {},
		set onfinish(done: () => void) {
			queueMicrotask(done);
		}
	} as unknown as Animation;
}

beforeEach(() => {
	Element.prototype.animate = fakeAnimate;
	vi.useFakeTimers();
});

afterEach(() => {
	Element.prototype.animate = nativeAnimate;
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

	test('merges the two sheets before the check draws in', async () => {
		mockClipboard({ writeText: vi.fn().mockResolvedValue(undefined) });
		const { container } = render(CopyButton, { value: 'sk-123' });
		const sheet = container.querySelector('rect');
		expect(sheet?.getAttribute('class')).not.toContain('[translate:-6px_-6px]');

		await fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
		expect(sheet?.getAttribute('class')).toContain('[translate:-6px_-6px]');
		const check = container.querySelector('path[pathLength="1"]');
		expect(check?.getAttribute('class')).toContain('[stroke-dashoffset:0]');
	});

	test('text mode names the button with the text it shows and flips into the confirmation', async () => {
		mockClipboard({ writeText: vi.fn().mockResolvedValue(undefined) });
		const onCopy = vi.fn();
		const { container } = render(CopyButton, {
			value: 'run_8f2c41',
			label: 'Copy run ID',
			mode: 'text',
			onCopy,
			timeout: 1000
		});
		const button = screen.getByRole('button', { name: 'Copy run ID run_8f2c41' });
		const letters = () =>
			[...container.querySelectorAll('[aria-hidden="true"] > span > span')]
				.map((node) => node.textContent)
				.join('')
				.trim();
		expect(letters()).toBe('run_8f2c41');

		await fireEvent.click(button);
		await act(() => vi.advanceTimersByTimeAsync(0));
		expect(onCopy).toHaveBeenCalledWith('run_8f2c41');
		expect(letters()).toBe('Copied');
		expect(liveRegion(container)).toBe('Copied');
		expect(button).toHaveAccessibleName('Copy run ID run_8f2c41');

		await act(() => vi.advanceTimersByTimeAsync(1000));
		expect(letters()).toBe('run_8f2c41');
	});

	test('text mode flips into the failure text when the clipboard refuses', async () => {
		mockClipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) });
		const { container } = render(CopyButton, {
			value: 'run_8f2c41',
			mode: 'text',
			failedText: "Couldn't copy"
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Copy run_8f2c41' }));
		await act(() => vi.advanceTimersByTimeAsync(0));
		expect(liveRegion(container)).toBe("Couldn't copy");
	});

	test('text mode flips wide or joined scripts as a whole word, not letter by letter', async () => {
		mockClipboard({ writeText: vi.fn().mockResolvedValue(undefined) });
		const { container } = render(CopyButton, {
			value: 'run_8f2c41',
			mode: 'text',
			copiedText: 'コピーしました'
		});
		const cells = () => container.querySelectorAll('.w-\\[1ch\\]');
		const word = () => container.querySelector('[data-word]')?.textContent;
		expect(cells()).toHaveLength(0);
		expect(word()).toBe('run_8f2c41');

		await fireEvent.click(screen.getByRole('button', { name: 'Copy run_8f2c41' }));
		await act(() => vi.advanceTimersByTimeAsync(0));
		expect(word()).toBe('コピーしました');
		expect(liveRegion(container)).toBe('コピーしました');

		// Latin text keeps its letter by letter flip.
		const { container: latin } = render(CopyButton, { value: 'run_8f2c41', mode: 'text' });
		expect(latin.querySelectorAll('.w-\\[1ch\\]')).toHaveLength(11);
	});

	test('ignores the result of a copy that a newer click superseded', async () => {
		let rejectFirst: (error: Error) => void = () => {};
		const writeText = vi
			.fn()
			.mockImplementationOnce(() => new Promise((_, reject) => (rejectFirst = reject)))
			.mockResolvedValueOnce(undefined);
		mockClipboard({ writeText });
		render(CopyButton, { value: 'sk-123' });
		const button = screen.getByRole('button', { name: 'Copy' });

		await fireEvent.click(button);
		await fireEvent.click(button);
		expect(button).toHaveAttribute('data-status', 'copied');
		rejectFirst(new Error('late'));
		await act(() => vi.advanceTimersByTimeAsync(0));
		expect(button).toHaveAttribute('data-status', 'copied');
	});
});
