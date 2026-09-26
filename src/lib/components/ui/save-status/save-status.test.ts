import { act, render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import SaveStatus from './save-status.svelte';

// jsdom has no Web Animations API; Svelte transitions finish on the next microtask.
const nativeAnimate = Element.prototype.animate;
beforeEach(() => {
	vi.useFakeTimers();
	Element.prototype.animate = function () {
		return {
			cancel() {},
			set onfinish(done: () => void) {
				queueMicrotask(done);
			}
		} as unknown as Animation;
	};
});
afterEach(() => {
	Element.prototype.animate = nativeAnimate;
	vi.useRealTimers();
});

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
const label = (container: HTMLElement) =>
	container.querySelector('.grid > span:last-child')?.textContent?.trim();
const dots = (container: HTMLElement) =>
	Array.from(container.querySelectorAll<HTMLElement>('[aria-hidden="true"] > span.absolute'));

describe('SaveStatus', () => {
	test('shows one dot for unsaved changes and three pulsing dots while saving', async () => {
		const { container, rerender } = render(SaveStatus, { state: 'unsaved' });
		expect(label(container)).toBe('Unsaved changes');
		expect(dots(container).map((dot) => dot.style.opacity)).toEqual(['0', '1', '0']);

		await rerender({ state: 'saving' });
		await advance(0);
		expect(label(container)).toBe('Saving');
		expect(dots(container).map((dot) => dot.style.opacity)).toEqual(['1', '1', '1']);
		expect(dots(container).map((dot) => dot.style.translate)).toEqual(['-5px 0', '0px 0', '5px 0']);
		expect(container.querySelectorAll('.save-pulse')).toHaveLength(3);
	});

	test('gathers the dots into a drawn check and announces the save once', async () => {
		const { container, rerender } = render(SaveStatus, { state: 'saving' });
		const live = container.querySelector('[aria-live="polite"]');
		expect(live?.textContent).toBe('');

		await rerender({ state: 'saved', savedAt: 1_000_000, now: 1_000_000 });
		expect(container.querySelector('path')).toHaveAttribute('stroke-dashoffset', '0');
		expect(dots(container).every((dot) => dot.style.opacity === '0')).toBe(true);
		expect(live?.textContent).toBe('All changes saved');

		await rerender({ state: 'unsaved', savedAt: 1_000_000, now: 1_000_000 });
		expect(live?.textContent).toBe('');
	});

	test('ages the saved label the way a person would say it', async () => {
		const savedAt = new Date('2026-09-26T10:00:00').getTime();
		const { container, rerender } = render(SaveStatus, {
			state: 'saved',
			savedAt,
			now: savedAt + 5_000
		});
		await advance(0);
		expect(label(container)).toBe('Saved just now');

		await rerender({ state: 'saved', savedAt, now: savedAt + 3 * 60_000 });
		await advance(0);
		expect(label(container)).toBe('Saved 3 min ago');

		await rerender({ state: 'saved', savedAt, now: savedAt + 2 * 60 * 60_000, locale: 'en-US' });
		await advance(0);
		expect(label(container)).toBe('Saved at 10:00 AM');
	});

	test('runs its own clock only while showing a save, and stops it when destroyed', async () => {
		vi.setSystemTime(new Date('2026-09-26T10:00:00'));
		const { container, unmount } = render(SaveStatus, { state: 'saved', savedAt: Date.now() });
		await advance(0);
		expect(label(container)).toBe('Saved just now');
		await advance(2 * 60_000);
		expect(label(container)).toBe('Saved 2 min ago');
		unmount();
		expect(vi.getTimerCount()).toBe(0);
	});
});
