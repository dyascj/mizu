import { afterEach, describe, expect, test, vi } from 'vitest';

import { toast, toaster } from './toast-state.svelte.js';

afterEach(() => {
	toast.clear();
	vi.useRealTimers();
});

describe('toast state', () => {
	test('preserves the exact remaining duration while paused', () => {
		vi.useFakeTimers();
		const id = toast({ title: 'Saved', duration: 1000 });

		vi.advanceTimersByTime(400);
		toaster.pause(id);
		vi.advanceTimersByTime(2000);
		expect(toaster.toasts).toHaveLength(1);

		toaster.resume(id);
		vi.advanceTimersByTime(599);
		expect(toaster.toasts).toHaveLength(1);
		vi.advanceTimersByTime(1);
		expect(toaster.toasts).toHaveLength(0);
	});

	test('keeps zero-duration toasts until explicitly dismissed', () => {
		vi.useFakeTimers();
		const id = toast({ title: 'Persistent', duration: 0 });

		vi.runAllTimers();
		expect(toaster.toasts).toHaveLength(1);
		toast.dismiss(id);
		expect(toaster.toasts).toHaveLength(0);
	});
});
