import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import AsyncButton from './async-button.svelte';

const children = createRawSnippet(() => ({ render: () => '<span>Save changes</span>' }));

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

function deferred() {
	let resolve: (value?: unknown) => void = () => {};
	let reject: (error: unknown) => void = () => {};
	const promise = new Promise((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

describe('AsyncButton', () => {
	test('is a plain button named by its label', () => {
		const { container } = render(AsyncButton, { action: vi.fn(), children });
		const button = screen.getByRole('button', { name: 'Save changes' });
		expect(button).toHaveAttribute('type', 'button');
		expect(button).toHaveAttribute('data-status', 'idle');
		expect(liveRegion(container)).toBe('');
	});

	test('works, succeeds, announces each step, and returns to rest', async () => {
		const work = deferred();
		const onSuccess = vi.fn();
		const { container } = render(AsyncButton, {
			action: () => work.promise,
			onSuccess,
			children,
			timeout: 1000,
			pendingLabel: 'Saving',
			successLabel: 'Changes saved'
		});
		const button = screen.getByRole('button', { name: 'Save changes' });

		await fireEvent.click(button);
		expect(button).toHaveAttribute('data-status', 'pending');
		expect(button).toHaveAttribute('aria-busy', 'true');
		expect(button).toHaveAttribute('aria-disabled', 'true');
		expect(liveRegion(container)).toBe('Saving');
		// Focus survives the working state because the button is never disabled.
		expect(button).not.toBeDisabled();

		await act(() => work.resolve('ok'));
		expect(button).toHaveAttribute('data-status', 'success');
		expect(onSuccess).toHaveBeenCalledWith('ok');
		expect(liveRegion(container)).toBe('Changes saved');
		expect(button).toHaveAccessibleName('Save changes');

		await advance(1000);
		expect(button).toHaveAttribute('data-status', 'idle');
	});

	test('ignores presses while working', async () => {
		const work = deferred();
		const action = vi.fn(() => work.promise);
		render(AsyncButton, { action, children });
		const button = screen.getByRole('button', { name: 'Save changes' });

		await fireEvent.click(button);
		await fireEvent.click(button);
		expect(action).toHaveBeenCalledTimes(1);
	});

	test('fails into a retry label that names the button, then tries again', async () => {
		const onError = vi.fn();
		const action = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(1);
		const { container } = render(AsyncButton, {
			action,
			onError,
			children,
			retryLabel: 'Retry save'
		});
		const button = screen.getByRole('button', { name: 'Save changes' });

		await fireEvent.click(button);
		await advance(0);
		expect(button).toHaveAttribute('data-status', 'error');
		expect(onError).toHaveBeenCalledWith(expect.any(Error));
		expect(liveRegion(container)).toBe("Couldn't finish. Try again.");
		expect(button).toHaveAccessibleName('Retry save');
		expect(button).not.toHaveAttribute('aria-disabled');

		await fireEvent.click(button);
		await advance(0);
		expect(action).toHaveBeenCalledTimes(2);
		expect(button).toHaveAttribute('data-status', 'success');
	});

	test('treats a synchronous throw as a failure', async () => {
		render(AsyncButton, {
			action: () => {
				throw new Error('boom');
			},
			children
		});
		const button = screen.getByRole('button', { name: 'Save changes' });
		await fireEvent.click(button);
		await advance(0);
		expect(button).toHaveAttribute('data-status', 'error');
	});

	test('does nothing while disabled', async () => {
		const action = vi.fn();
		render(AsyncButton, { action, children, disabled: true });
		const button = screen.getByRole('button', { name: 'Save changes' });
		expect(button).toBeDisabled();
		await fireEvent.click(button);
		expect(action).not.toHaveBeenCalled();
	});

	test('drops a late result and clears its timer when destroyed', async () => {
		const work = deferred();
		const onSuccess = vi.fn();
		const { unmount } = render(AsyncButton, { action: () => work.promise, onSuccess, children });
		await fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
		await advance(0);
		unmount();
		await act(() => work.resolve());
		expect(onSuccess).not.toHaveBeenCalled();
		expect(vi.getTimerCount()).toBe(0);
	});
});
