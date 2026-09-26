import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import UploadButton from './upload-button.svelte';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
const liveRegion = (container: HTMLElement) =>
	container.querySelector('[aria-live="polite"]')?.textContent?.trim();

function setup(props: Record<string, unknown> = {}) {
	const callbacks = { onStart: vi.fn(), onCancel: vi.fn(), onReset: vi.fn() };
	const result = render(UploadButton, { status: 'idle', progress: 0, ...callbacks, ...props });
	return { ...result, ...callbacks };
}

describe('UploadButton', () => {
	test('rests as a named button with a hidden progressbar', () => {
		const { container } = setup();
		expect(screen.getByRole('button', { name: 'Upload' })).toHaveAttribute('data-status', 'idle');
		expect(container.querySelector('[role="progressbar"]')).toHaveAttribute('aria-hidden', 'true');
		expect(liveRegion(container)).toBe('');
	});

	test('starts on press', async () => {
		const { onStart } = setup();
		await fireEvent.click(screen.getByRole('button', { name: 'Upload' }));
		expect(onStart).toHaveBeenCalledTimes(1);
	});

	test('reports progress while uploading and cancels on press', async () => {
		const { container, onCancel, rerender } = setup();
		await rerender({ status: 'uploading', progress: 0.42 });
		const button = screen.getByRole('button', { name: 'Cancel upload' });
		expect(button).toHaveAttribute('aria-busy', 'true');
		const bar = screen.getByRole('progressbar', { name: 'Upload progress' });
		expect(bar).toHaveAttribute('aria-valuenow', '42');
		expect(bar).not.toHaveAttribute('aria-hidden', 'true');
		expect(liveRegion(container)).toBe('Uploading');

		// The ring glides toward the value rather than jumping.
		await advance(48);
		const shown = Number(button.textContent?.match(/\d+/)?.[0]);
		expect(shown).toBeGreaterThan(0);
		expect(shown).toBeLessThan(42);
		await advance(1000);
		expect(button.textContent).toContain('42');

		await fireEvent.click(button);
		expect(onCancel).toHaveBeenCalledTimes(1);
		await rerender({ status: 'idle', progress: 0.42 });
		expect(liveRegion(container)).toBe('Upload cancelled');
	});

	test('checks off only once the ring closes, then asks to reset', async () => {
		const { container, onReset, rerender } = setup({ timeout: 1000 });
		await rerender({ status: 'uploading', progress: 0.5 });
		await rerender({ status: 'done', progress: 1 });
		const button = screen.getByRole('button', { name: 'Upload complete' });
		expect(button).toHaveAttribute('aria-disabled', 'true');
		expect(liveRegion(container)).toBe('Upload complete');
		expect(button.className).not.toContain('bg-primary');

		await advance(1000);
		expect(button.className).toContain('bg-primary');
		expect(onReset).not.toHaveBeenCalled();
		await advance(1000);
		expect(onReset).toHaveBeenCalledTimes(1);
	});

	test('ignores presses once done', async () => {
		const { onStart, onCancel, rerender } = setup();
		await rerender({ status: 'done', progress: 1 });
		await fireEvent.click(screen.getByRole('button', { name: 'Upload complete' }));
		expect(onStart).not.toHaveBeenCalled();
		expect(onCancel).not.toHaveBeenCalled();
	});

	test('jumps straight to the value under reduced motion', async () => {
		vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
		const { rerender } = setup();
		await rerender({ status: 'uploading', progress: 0.3 });
		expect(screen.getByRole('button', { name: 'Cancel upload' }).textContent).toContain('30');
	});

	test('stops its frame loop and timer when destroyed', async () => {
		const { rerender, unmount } = setup();
		await rerender({ status: 'uploading', progress: 0.5 });
		await rerender({ status: 'done', progress: 1 });
		await advance(600);
		unmount();
		expect(vi.getTimerCount()).toBe(0);
	});
});
