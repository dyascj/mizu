import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import DownloadButton from './download-button.svelte';

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
const fillShare = (button: HTMLElement) => {
	const clip = button.querySelector<HTMLElement>('.bg-primary')?.style.clipPath ?? '';
	const right = Number(clip.match(/inset\(0(?:px)? ([\d.]+)%/)?.[1]);
	return 1 - right / 100;
};

function setup(props: Record<string, unknown> = {}) {
	const callbacks = { onStart: vi.fn(), onCancel: vi.fn(), onReset: vi.fn() };
	const result = render(DownloadButton, { status: 'idle', progress: 0, ...callbacks, ...props });
	return { ...result, ...callbacks };
}

describe('DownloadButton', () => {
	test('rests as a named button with an empty fill', () => {
		const { container } = setup();
		const button = screen.getByRole('button', { name: 'Download' });
		expect(button).toHaveAttribute('data-status', 'idle');
		expect(fillShare(button)).toBe(0);
		expect(container.querySelector('[role="progressbar"]')).toHaveAttribute('aria-hidden', 'true');
	});

	test('starts on press and announces it', async () => {
		const { container, onStart } = setup();
		await fireEvent.click(screen.getByRole('button', { name: 'Download' }));
		expect(onStart).toHaveBeenCalledTimes(1);
		expect(liveRegion(container)).toBe('Downloading');
	});

	test('fills toward the progress and reports it, then cancels on press', async () => {
		const { container, onCancel, rerender } = setup();
		await rerender({ status: 'downloading', progress: 0.6 });
		const button = screen.getByRole('button', { name: 'Cancel download' });
		expect(screen.getByRole('progressbar', { name: 'Download progress' })).toHaveAttribute(
			'aria-valuenow',
			'60'
		);
		await advance(48);
		expect(fillShare(button)).toBeGreaterThan(0);
		expect(fillShare(button)).toBeLessThan(0.6);
		await advance(1000);
		expect(fillShare(button)).toBeCloseTo(0.6, 2);
		expect(button.textContent).toContain('60%');

		await fireEvent.click(button);
		expect(onCancel).toHaveBeenCalledTimes(1);
		await rerender({ status: 'idle', progress: 0.6 });
		expect(liveRegion(container)).toBe('Download cancelled');
		// Drains back out.
		await advance(500);
		expect(fillShare(button)).toBe(0);
	});

	test('checks off once the fill reaches the end, then asks to reset', async () => {
		const { container, onReset, rerender } = setup({ timeout: 1000 });
		await rerender({ status: 'downloading', progress: 0.5 });
		await rerender({ status: 'done', progress: 1 });
		const button = screen.getByRole('button', { name: 'Download' });
		expect(button).toHaveAttribute('aria-disabled', 'true');
		expect(liveRegion(container)).toBe('');

		await advance(1000);
		expect(liveRegion(container)).toBe('Download complete');
		expect(onReset).not.toHaveBeenCalled();
		await advance(1000);
		expect(onReset).toHaveBeenCalledTimes(1);
	});

	test('says nothing more once a finished download returns to rest', async () => {
		const { container, rerender } = setup({ timeout: 1000 });
		await fireEvent.click(screen.getByRole('button', { name: 'Download' }));
		expect(liveRegion(container)).toBe('Downloading');
		await rerender({ status: 'downloading', progress: 0.5 });
		await rerender({ status: 'done', progress: 1 });
		await advance(1000);
		expect(liveRegion(container)).toBe('Download complete');
		await rerender({ status: 'idle', progress: 1 });
		expect(liveRegion(container)).toBe('');
	});

	test('jumps straight to the value under reduced motion', async () => {
		vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
		const { rerender } = setup();
		await rerender({ status: 'downloading', progress: 0.3 });
		expect(fillShare(screen.getByRole('button'))).toBeCloseTo(0.3, 5);
	});

	test('stops its frame loop and timers when destroyed', async () => {
		const { rerender, unmount } = setup();
		await rerender({ status: 'downloading', progress: 0.5 });
		await rerender({ status: 'done', progress: 1 });
		await advance(600);
		unmount();
		expect(vi.getTimerCount()).toBe(0);
	});
});
