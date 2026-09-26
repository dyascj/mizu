import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import HoldButton from './hold-button.svelte';

const children = createRawSnippet(() => ({ render: () => '<span>Hold to delete</span>' }));

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

function setup(props: Partial<{ duration: number; disabled: boolean }> = {}) {
	const onConfirm = vi.fn();
	const result = render(HoldButton, { onConfirm, children, ...props });
	const button = screen.getByRole('button', { name: 'Hold to delete' });
	return { ...result, onConfirm, button };
}

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

/** The share of the pill the fill covers, read from its clip-path. */
function fillProgress(button: HTMLElement) {
	const fill = button.querySelector<HTMLElement>('[aria-hidden="true"]');
	const right = fill?.style.clipPath.match(/inset\(0(?:px)? ([\d.]+)%/)?.[1];
	return 1 - Number(right) / 100;
}

describe('HoldButton', () => {
	test('describes the gesture and starts with a quiet live region', () => {
		const { button, container } = setup();
		expect(button).toHaveAttribute('type', 'button');
		expect(button).toHaveAccessibleDescription('Press and hold to confirm');
		expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe('');
	});

	test('confirms once after a full pointer hold and announces it', async () => {
		const { button, onConfirm } = setup({ duration: 1000 });

		await fireEvent.pointerDown(button, { button: 0, pointerId: 1 });
		await advance(500);
		expect(fillProgress(button)).toBeGreaterThan(0.4);
		expect(onConfirm).not.toHaveBeenCalled();

		await advance(600);
		expect(onConfirm).toHaveBeenCalledTimes(1);
		expect(button).toHaveAttribute('data-phase', 'done');
		expect(screen.getByText('Confirmed')).toHaveAttribute('aria-live', 'polite');

		// Staying pressed does not confirm again.
		await advance(1500);
		await fireEvent.pointerUp(button, { pointerId: 1 });
		expect(onConfirm).toHaveBeenCalledTimes(1);
	});

	test('springs back when released early', async () => {
		const { button, onConfirm } = setup({ duration: 1000 });

		await fireEvent.pointerDown(button, { button: 0, pointerId: 1 });
		await advance(600);
		await fireEvent.pointerUp(button, { pointerId: 1 });
		expect(button).toHaveAttribute('data-phase', 'retracting');

		await advance(1000);
		expect(button).toHaveAttribute('data-phase', 'idle');
		expect(fillProgress(button)).toBe(0);
		expect(onConfirm).not.toHaveBeenCalled();
	});

	test('cancels when the pointer leaves the button or the gesture is cancelled', async () => {
		const { button, onConfirm } = setup({ duration: 1000 });
		button.getBoundingClientRect = () => DOMRect.fromRect({ x: 0, y: 0, width: 120, height: 40 });

		await fireEvent.pointerDown(button, { button: 0, pointerId: 1, clientX: 60, clientY: 20 });
		await advance(300);
		await fireEvent.pointerMove(button, { pointerId: 1, clientX: 80, clientY: 20 });
		expect(button).toHaveAttribute('data-phase', 'holding');
		await fireEvent.pointerMove(button, { pointerId: 1, clientX: 200, clientY: 20 });
		expect(button).toHaveAttribute('data-phase', 'retracting');

		await fireEvent.pointerDown(button, { button: 0, pointerId: 2 });
		await advance(300);
		await fireEvent.pointerCancel(button, { pointerId: 2 });
		expect(button).toHaveAttribute('data-phase', 'retracting');

		await advance(2000);
		expect(onConfirm).not.toHaveBeenCalled();
	});

	test('ignores secondary buttons', async () => {
		const { button } = setup();
		await fireEvent.pointerDown(button, { button: 2, pointerId: 1 });
		expect(button).toHaveAttribute('data-phase', 'idle');
	});

	test('holds with Space or Enter, and key repeat never restarts the hold', async () => {
		const { button, onConfirm } = setup({ duration: 1000 });

		await fireEvent.keyDown(button, { key: ' ' });
		await advance(700);
		await fireEvent.keyDown(button, { key: ' ', repeat: true });
		await advance(400);
		expect(onConfirm).toHaveBeenCalledTimes(1);
		await fireEvent.keyUp(button, { key: ' ' });

		await advance(3000);
		expect(button).toHaveAttribute('data-phase', 'idle');

		await fireEvent.keyDown(button, { key: 'Enter' });
		await advance(400);
		await fireEvent.keyUp(button, { key: 'Enter' });
		await advance(1000);
		expect(onConfirm).toHaveBeenCalledTimes(1);
	});

	test('cancels a keyboard hold when focus leaves', async () => {
		const { button, onConfirm } = setup({ duration: 1000 });
		await fireEvent.keyDown(button, { key: 'Enter' });
		await advance(500);
		await fireEvent.blur(button);
		await advance(1000);
		expect(onConfirm).not.toHaveBeenCalled();
	});

	test('resumes from a retracting fill instead of starting over', async () => {
		const { button, onConfirm } = setup({ duration: 1000 });
		await fireEvent.pointerDown(button, { button: 0, pointerId: 1 });
		await advance(800);
		await fireEvent.pointerUp(button, { pointerId: 1 });
		await advance(16);
		await fireEvent.pointerDown(button, { button: 0, pointerId: 1 });
		await advance(500);
		expect(onConfirm).toHaveBeenCalledTimes(1);
	});

	test('skips the spring back under reduced motion but still shows progress', async () => {
		vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
		const { button } = setup({ duration: 1000 });

		await fireEvent.pointerDown(button, { button: 0, pointerId: 1 });
		await advance(500);
		expect(fillProgress(button)).toBeGreaterThan(0.4);
		await fireEvent.pointerUp(button, { pointerId: 1 });
		expect(button).toHaveAttribute('data-phase', 'idle');
		expect(fillProgress(button)).toBe(0);
	});

	test('does nothing while disabled', async () => {
		const { button, onConfirm } = setup({ disabled: true, duration: 500 });
		expect(button).toBeDisabled();
		await fireEvent.keyDown(button, { key: ' ' });
		await advance(1000);
		expect(onConfirm).not.toHaveBeenCalled();
	});

	test('stops its frame loop and timers when destroyed', async () => {
		const { button, unmount } = setup({ duration: 1000 });
		await fireEvent.pointerDown(button, { button: 0, pointerId: 1 });
		await advance(1100);
		expect(button).toHaveAttribute('data-phase', 'done');

		unmount();
		expect(vi.getTimerCount()).toBe(0);
	});
});
