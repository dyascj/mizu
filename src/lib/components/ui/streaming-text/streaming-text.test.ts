import { act, render } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';

import StreamingText from './streaming-text.svelte';

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('StreamingText', () => {
	test('exposes stable full text while revealing visual tokens over time', async () => {
		vi.useFakeTimers();
		const onComplete = vi.fn();
		const { container } = render(StreamingText, {
			text: 'Hello world',
			speed: 10,
			onComplete
		});
		const root = container.firstElementChild as HTMLElement;
		const accessible = container.querySelector<HTMLElement>('.sr-only');
		const visual = container.querySelector<HTMLElement>('[aria-hidden="true"]');

		expect(root).toContainElement(accessible);
		expect(accessible).toHaveTextContent('Hello world');
		expect(visual).toHaveTextContent('');

		await act(() => vi.advanceTimersByTimeAsync(10));
		expect(visual).toHaveTextContent('Hello');
		expect(onComplete).not.toHaveBeenCalled();

		await act(() => vi.advanceTimersByTimeAsync(20));
		expect(visual).toHaveTextContent('Hello world');
		expect(onComplete).toHaveBeenCalledTimes(1);
	});

	test('restarts on text changes and cancels stale completion', async () => {
		vi.useFakeTimers();
		const firstComplete = vi.fn();
		const secondComplete = vi.fn();
		const { container, rerender } = render(StreamingText, {
			text: 'First response',
			speed: 20,
			onComplete: firstComplete
		});

		await act(() => vi.advanceTimersByTimeAsync(20));
		await rerender({ text: 'Next', speed: 20, onComplete: secondComplete });
		await act(() => vi.advanceTimersByTimeAsync(20));

		expect(firstComplete).not.toHaveBeenCalled();
		expect(secondComplete).toHaveBeenCalledTimes(1);
		expect(container.querySelector('.sr-only')).toHaveTextContent('Next');
	});

	test('reveals immediately for non-positive speed and reduced motion', async () => {
		const onComplete = vi.fn();
		const { container, unmount } = render(StreamingText, {
			text: 'Instant text',
			speed: 0,
			onComplete
		});

		expect(container.querySelector('.sr-only')).toHaveTextContent('Instant text');
		expect(onComplete).toHaveBeenCalledTimes(1);
		unmount();

		vi.stubGlobal(
			'matchMedia',
			vi.fn().mockReturnValue({
				matches: true,
				addEventListener: vi.fn(),
				removeEventListener: vi.fn()
			})
		);
		const reduced = render(StreamingText, { text: 'Reduced motion', speed: 100, onComplete });

		expect(reduced.container.querySelector('.sr-only')).toHaveTextContent('Reduced motion');
		expect(onComplete).toHaveBeenCalledTimes(2);
	});
});
