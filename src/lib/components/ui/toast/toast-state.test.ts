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

describe('undo toasts', () => {
	test('undo restores without committing and announces it', async () => {
		const onUndo = vi.fn();
		const onCommit = vi.fn();
		const id = toast.undo({ title: 'Deleted chat', onUndo, onCommit });
		expect(toaster.toasts[0].undo).toBeDefined();

		toaster.undo(id);
		expect(onUndo).toHaveBeenCalledOnce();
		expect(onCommit).not.toHaveBeenCalled();
		expect(toaster.toasts).toHaveLength(0);
		await Promise.resolve();
		expect(toaster.announcement).toBe('Restored');
	});

	test('commits when the countdown runs out or the toast is dismissed', () => {
		vi.useFakeTimers();
		const onCommit = vi.fn();
		toast.undo({ title: 'Deleted chat', duration: 1000, onUndo: vi.fn(), onCommit });
		vi.advanceTimersByTime(999);
		expect(onCommit).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(onCommit).toHaveBeenCalledOnce();

		const second = vi.fn();
		const id = toast.undo({ title: 'Deleted file', onUndo: vi.fn(), onCommit: second });
		toast.dismiss(id);
		expect(second).toHaveBeenCalledOnce();
	});

	test('folds a second action into the same toast and restarts its countdown', () => {
		vi.useFakeTimers();
		const first = vi.fn();
		const id = toast.undo({
			title: 'Deleted one',
			duration: 1000,
			onUndo: vi.fn(),
			onCommit: first
		});
		vi.advanceTimersByTime(800);
		const second = vi.fn();
		const same = toast.undo({
			id,
			title: '2 items deleted',
			duration: 1000,
			onUndo: vi.fn(),
			onCommit: second
		});

		expect(same).toBe(id);
		expect(toaster.toasts).toHaveLength(1);
		expect(toaster.toasts[0]).toMatchObject({ title: '2 items deleted', version: 1 });
		vi.advanceTimersByTime(800);
		expect(toaster.toasts).toHaveLength(1);
		vi.advanceTimersByTime(200);
		expect(first).not.toHaveBeenCalled();
		expect(second).toHaveBeenCalledOnce();
	});
});

describe('holds', () => {
	test('a hold stops every timer until its last reason is released', () => {
		vi.useFakeTimers();
		toast({ title: 'One', duration: 1000 });
		toast({ title: 'Two', duration: 2000 });
		vi.advanceTimersByTime(500);
		toaster.hold('hover', true);
		toaster.hold('hidden', true);
		expect(toaster.running[toaster.toasts[0].id]).toBe(false);
		vi.advanceTimersByTime(5000);
		expect(toaster.toasts).toHaveLength(2);

		toaster.hold('hover', false);
		vi.advanceTimersByTime(5000);
		expect(toaster.toasts).toHaveLength(2);
		toaster.hold('hidden', false);
		vi.advanceTimersByTime(500);
		expect(toaster.toasts.map((t) => t.title)).toEqual(['Two']);
	});

	test('a toast paused on its own stays paused when the hold lifts', () => {
		vi.useFakeTimers();
		const id = toast({ title: 'Read me', duration: 1000 });
		toaster.pause(id);
		toaster.hold('hover', true);
		toaster.hold('hover', false);
		vi.advanceTimersByTime(3000);
		expect(toaster.toasts).toHaveLength(1);
	});
});

describe('promise toasts', () => {
	test('one toast morphs from loading to success', async () => {
		let resolve: (value: string) => void = () => {};
		const id = toast.promise(new Promise<string>((r) => (resolve = r)), {
			loading: 'Saving',
			success: (name) => `Saved ${name}`,
			error: "Couldn't save"
		});
		expect(toaster.toasts[0]).toMatchObject({ id, title: 'Saving', loading: true, duration: 0 });

		resolve('draft');
		await vi.waitFor(() => expect(toaster.toasts[0].title).toBe('Saved draft'));
		expect(toaster.toasts).toHaveLength(1);
		expect(toaster.toasts[0]).toMatchObject({ id, variant: 'success', version: 1 });
		expect(toaster.toasts[0].loading).toBeFalsy();
	});

	test('an error offers Retry, which runs the task again in the same toast', async () => {
		const task = vi
			.fn<(signal: AbortSignal) => Promise<void>>()
			.mockRejectedValueOnce(new Error('offline'))
			.mockResolvedValueOnce(undefined);
		const id = toast.promise(task, {
			loading: 'Saving',
			success: 'Saved',
			error: { title: "Couldn't save", description: 'Check your connection.' },
			retry: true
		});
		await vi.waitFor(() => expect(toaster.toasts[0].variant).toBe('error'));
		const retry = toaster.toasts[0].action;
		expect(retry).toMatchObject({ label: 'Retry', dismiss: false });

		retry?.onclick();
		expect(toaster.toasts).toHaveLength(1);
		expect(toaster.toasts[0]).toMatchObject({ id, loading: true });
		await vi.waitFor(() => expect(toaster.toasts[0].title).toBe('Saved'));
		expect(task).toHaveBeenCalledTimes(2);
	});

	test('a newer run in the same toast aborts the older one and drops its result', async () => {
		const signals: AbortSignal[] = [];
		let rejectFirst: () => void = () => {};
		const id = toast.promise(
			(signal) => {
				signals.push(signal);
				return new Promise<void>((_, reject) => (rejectFirst = reject));
			},
			{ loading: 'Saving', success: 'Saved', error: 'Failed' }
		);
		toast.promise(Promise.resolve(), {
			id,
			loading: 'Saving again',
			success: 'Saved',
			error: 'Failed'
		});
		expect(signals[0].aborted).toBe(true);
		rejectFirst();
		await vi.waitFor(() => expect(toaster.toasts[0].title).toBe('Saved'));
		expect(toaster.toasts[0].variant).toBe('success');
	});
});
