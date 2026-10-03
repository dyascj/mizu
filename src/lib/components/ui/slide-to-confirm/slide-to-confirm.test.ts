import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import SlideToConfirm from './slide-to-confirm.svelte';

beforeEach(() => {
	vi.useFakeTimers();
	// jsdom has no layout: give the track a 360px width.
	vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(360);
});

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
const liveRegion = (container: HTMLElement) =>
	container.querySelector('[aria-live="polite"]')?.textContent?.trim();
const offset = (knob: HTMLElement) => parseFloat(knob.style.translate || '0');

/** The knob can travel 360 - 56 - 8 = 296px. */
const MAX = 296;

function setup(props: Record<string, unknown> = {}) {
	const onConfirm = vi.fn();
	const result = render(SlideToConfirm, { onConfirm, ...props });
	const knob = screen.getByRole('button', { name: 'Slide to confirm' });
	return { ...result, onConfirm, knob };
}

async function drag(knob: HTMLElement, to: number, { steps = 10, stepMs = 30 } = {}) {
	await fireEvent.pointerDown(knob, { pointerId: 1, pointerType: 'touch', clientX: 0 });
	for (let i = 1; i <= steps; i++) {
		await advance(stepMs);
		await fireEvent.pointerMove(knob, {
			pointerId: 1,
			clientX: (to * i) / steps,
			timeStamp: performance.now()
		});
	}
}

describe('SlideToConfirm', () => {
	test('exposes a named knob with instructions and a quiet live region', () => {
		const { container, knob } = setup();
		expect(knob).toHaveAttribute('type', 'button');
		expect(knob).toHaveAccessibleDescription('Drag to the end, or press Enter');
		expect(liveRegion(container)).toBe('');
	});

	test('confirms when dragged to the end, announces it, and glides home', async () => {
		const { container, knob, onConfirm } = setup({ timeout: 1000 });
		await drag(knob, MAX + 10);
		expect(onConfirm).toHaveBeenCalledTimes(1);
		expect(liveRegion(container)).toBe('Confirmed');
		expect(knob).toHaveAttribute('aria-disabled', 'true');
		await advance(600);
		expect(offset(knob)).toBeCloseTo(MAX, 0);

		await advance(400);
		expect(liveRegion(container)).toBe('');
		await advance(1500);
		expect(offset(knob)).toBe(0);
	});

	test('springs back when released short of the end', async () => {
		const { knob, onConfirm } = setup();
		await drag(knob, 150, { steps: 10, stepMs: 60 });
		expect(offset(knob)).toBeCloseTo(150, 0);
		await fireEvent.pointerUp(knob, { pointerId: 1 });
		await advance(1500);
		expect(offset(knob)).toBe(0);
		expect(onConfirm).not.toHaveBeenCalled();
	});

	test('stretches only a little past the start', async () => {
		const { knob } = setup();
		await drag(knob, -200);
		expect(offset(knob)).toBeLessThan(0);
		expect(offset(knob)).toBeGreaterThanOrEqual(-6);
	});

	test('confirms from the keyboard and from assistive technology clicks', async () => {
		const { knob, onConfirm } = setup({ timeout: 500 });
		await fireEvent.keyDown(knob, { key: 'ArrowRight' });
		expect(onConfirm).toHaveBeenCalledTimes(1);
		// Confirming again while confirmed does nothing.
		await fireEvent.keyDown(knob, { key: 'End' });
		expect(onConfirm).toHaveBeenCalledTimes(1);

		await advance(2000);
		await fireEvent.click(knob, { detail: 0 });
		expect(onConfirm).toHaveBeenCalledTimes(2);

		// A mouse click has a detail count and must still be dragged.
		await advance(2000);
		await fireEvent.click(knob, { detail: 1 });
		expect(onConfirm).toHaveBeenCalledTimes(2);
	});

	test('does nothing while disabled', async () => {
		const { knob, onConfirm } = setup({ disabled: true });
		expect(knob).toHaveAttribute('aria-disabled', 'true');
		await fireEvent.keyDown(knob, { key: 'ArrowRight' });
		await drag(knob, MAX + 10);
		expect(onConfirm).not.toHaveBeenCalled();
	});

	test('stays confirmed when the timeout is 0', async () => {
		const { container, knob } = setup({ timeout: 0 });
		await fireEvent.keyDown(knob, { key: 'Enter' });
		await fireEvent.click(knob, { detail: 0 });
		await advance(5000);
		expect(liveRegion(container)).toBe('Confirmed');
	});

	test('a confirmed knob follows the end when the track changes width', async () => {
		let resize: (() => void) | undefined;
		vi.stubGlobal(
			'ResizeObserver',
			class {
				constructor(callback: () => void) {
					resize = callback;
				}
				observe() {}
				disconnect() {}
			}
		);
		const width = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(360);
		const { knob } = setup({ timeout: 0 });
		await fireEvent.keyDown(knob, { key: 'ArrowRight' });
		await advance(1000);
		expect(offset(knob)).toBeCloseTo(MAX, 0);

		width.mockReturnValue(300);
		await act(() => resize?.());
		expect(offset(knob)).toBe(300 - 56 - 8);
	});

	describe('right to left', () => {
		beforeEach(() => {
			document.body.style.direction = 'rtl';
		});
		afterEach(() => {
			document.body.style.direction = '';
		});

		test('slides leftward: a drag to the left confirms, one to the right does not', async () => {
			const { knob, onConfirm } = setup();
			await drag(knob, 150);
			expect(onConfirm).not.toHaveBeenCalled();
			// Past the start, which is now on the right, it only gives a little.
			expect(offset(knob)).toBeGreaterThan(0);
			expect(offset(knob)).toBeLessThanOrEqual(6);
			await fireEvent.pointerUp(knob, { pointerId: 1 });
			await advance(1500);

			await drag(knob, -150, { steps: 10, stepMs: 60 });
			expect(offset(knob)).toBeCloseTo(-150, 0);
			await fireEvent.pointerUp(knob, { pointerId: 1 });
			await advance(1500);

			await drag(knob, -(MAX + 10));
			expect(onConfirm).toHaveBeenCalledTimes(1);
			await advance(600);
			expect(offset(knob)).toBeCloseTo(-MAX, 0);
		});

		test('ArrowLeft confirms and ArrowRight does not', async () => {
			const { knob, onConfirm } = setup();
			await fireEvent.keyDown(knob, { key: 'ArrowRight' });
			expect(onConfirm).not.toHaveBeenCalled();
			await fireEvent.keyDown(knob, { key: 'ArrowLeft' });
			expect(onConfirm).toHaveBeenCalledTimes(1);
		});
	});

	test('stops its frame loop and timer when destroyed', async () => {
		const { knob, unmount } = setup();
		await fireEvent.keyDown(knob, { key: 'ArrowRight' });
		unmount();
		expect(vi.getTimerCount()).toBe(0);
	});
});
