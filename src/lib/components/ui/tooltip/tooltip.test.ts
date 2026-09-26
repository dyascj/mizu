import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Harness from './tooltip.test.svelte';

const nativeAnimate = Element.prototype.animate;
beforeEach(() => {
	vi.useFakeTimers();
	// jsdom has no Web Animations API; Svelte transitions finish on the next microtask.
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
	vi.restoreAllMocks();
	vi.useRealTimers();
	Element.prototype.animate = nativeAnimate;
});

const mouse = { pointerType: 'mouse' };
const copy = () => screen.getByRole('button', { name: 'Copy' });
const regenerate = () => screen.getByRole('button', { name: 'Regenerate' });
const bubble = () => document.querySelector('[data-side]')!;

describe('Tooltip.Group', () => {
	test('each trigger is described by its own hidden tooltip text', () => {
		render(Harness);
		expect(copy()).toHaveAccessibleDescription('Copy');
		expect(regenerate()).toHaveAccessibleDescription('Regenerate, ⌘R');
		expect(screen.getByRole('link', { name: 'Share link' })).toHaveAccessibleDescription('Share');
		// The sliding bubble is a visual copy only.
		expect(bubble()).toHaveAttribute('aria-hidden', 'true');
	});

	test('opens after the delay, then slides straight to the next trigger', async () => {
		render(Harness);
		await fireEvent.pointerEnter(copy(), mouse);
		await act(() => vi.advanceTimersByTimeAsync(199));
		expect(copy()).toHaveAttribute('data-state', 'closed');
		await act(() => vi.advanceTimersByTimeAsync(1));
		expect(copy()).toHaveAttribute('data-state', 'open');
		expect(bubble()).toHaveAttribute('data-state', 'open');
		expect(bubble()).toHaveTextContent('Copy');

		await fireEvent.pointerLeave(copy(), mouse);
		await fireEvent.pointerEnter(regenerate(), mouse);
		expect(regenerate()).toHaveAttribute('data-state', 'open');
		expect(copy()).toHaveAttribute('data-state', 'closed');
	});

	test('a label that changes while showing updates the bubble and its size', async () => {
		const { rerender } = render(Harness);
		const measure = () => bubble().nextElementSibling as HTMLElement;
		await fireEvent.pointerEnter(copy(), mouse);
		await act(() => vi.advanceTimersByTimeAsync(200));
		expect(bubble()).toHaveTextContent('Copy');

		await rerender({ copyLabel: 'Copied to clipboard' });
		expect(bubble()).toHaveTextContent('Copied to clipboard');
		expect(measure()).toHaveTextContent('Copied to clipboard');
		expect(copy()).toHaveAccessibleDescription('Copied to clipboard');
	});

	test('stays warm for a moment after closing, then waits again', async () => {
		render(Harness);
		await fireEvent.pointerEnter(copy(), mouse);
		await act(() => vi.advanceTimersByTimeAsync(200));
		await fireEvent.pointerLeave(copy(), mouse);
		expect(bubble()).toHaveAttribute('data-state', 'closed');

		await act(() => vi.advanceTimersByTimeAsync(250));
		await fireEvent.pointerEnter(regenerate(), mouse);
		expect(regenerate()).toHaveAttribute('data-state', 'open');
		await fireEvent.pointerLeave(regenerate(), mouse);

		await act(() => vi.advanceTimersByTimeAsync(300));
		await fireEvent.pointerEnter(copy(), mouse);
		expect(copy()).toHaveAttribute('data-state', 'closed');
	});

	test('a press or Escape closes it until the pointer moves on', async () => {
		render(Harness);
		await fireEvent.pointerEnter(copy(), mouse);
		await act(() => vi.advanceTimersByTimeAsync(200));
		await fireEvent.pointerDown(copy(), mouse);
		expect(copy()).toHaveAttribute('data-state', 'closed');
		await fireEvent.pointerEnter(copy(), mouse);
		expect(copy()).toHaveAttribute('data-state', 'closed');

		await fireEvent.pointerLeave(copy(), mouse);
		await fireEvent.pointerEnter(regenerate(), mouse);
		expect(regenerate()).toHaveAttribute('data-state', 'open');
		await fireEvent.keyDown(document, { key: 'Escape' });
		expect(regenerate()).toHaveAttribute('data-state', 'closed');
	});

	test('keyboard focus opens at once, and touch never hovers it open', async () => {
		render(Harness);
		await fireEvent.pointerEnter(copy(), { pointerType: 'touch' });
		await act(() => vi.advanceTimersByTimeAsync(1000));
		expect(copy()).toHaveAttribute('data-state', 'closed');

		// jsdom never matches :focus-visible, which a real keyboard focus would.
		const matches = Element.prototype.matches;
		vi.spyOn(Element.prototype, 'matches').mockImplementation(function (this: Element, selector) {
			return selector === ':focus-visible' || matches.call(this, selector);
		});
		await act(() => regenerate().focus());
		expect(regenerate()).toHaveAttribute('data-state', 'open');
		await act(() => regenerate().blur());
		expect(regenerate()).toHaveAttribute('data-state', 'closed');
	});
});
