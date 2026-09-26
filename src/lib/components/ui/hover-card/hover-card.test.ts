import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Harness from './hover-card.test.svelte';

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
const ava = () => screen.getByRole('button', { name: '@ava' });
const ben = () => screen.getByRole('button', { name: '@ben' });
const card = (name: string) => screen.queryByRole('group', { name });
const flush = () => act(() => vi.advanceTimersByTimeAsync(0));

describe('HoverCard.Group', () => {
	test('opens after resting on a trigger and links the trigger to its card', async () => {
		render(Harness);
		await fireEvent.pointerEnter(ava().parentElement!, mouse);
		await act(() => vi.advanceTimersByTimeAsync(499));
		expect(card('Ava Chen, @ava')).not.toBeInTheDocument();
		await act(() => vi.advanceTimersByTimeAsync(1));

		const opened = card('Ava Chen, @ava');
		expect(opened).toHaveTextContent('Builds eval harnesses.');
		expect(ava()).toHaveAttribute('aria-expanded', 'true');
		expect(ava()).toHaveAttribute('aria-controls', opened!.id);
	});

	test('one card moves between names without waiting again', async () => {
		render(Harness);
		await fireEvent.pointerEnter(ava().parentElement!, mouse);
		await act(() => vi.advanceTimersByTimeAsync(500));
		await fireEvent.pointerLeave(ava().parentElement!, mouse);
		await fireEvent.pointerEnter(ben().parentElement!, mouse);
		await flush();

		expect(card('Ben Ortiz, @ben')).toBeInTheDocument();
		expect(card('Ava Chen, @ava')).not.toBeInTheDocument();
		expect(ava()).toHaveAttribute('aria-expanded', 'false');
	});

	test('waits a moment before closing, and reopens at once right after', async () => {
		render(Harness);
		await fireEvent.pointerEnter(ava().parentElement!, mouse);
		await act(() => vi.advanceTimersByTimeAsync(500));
		await fireEvent.pointerLeave(ava().parentElement!, mouse);
		await act(() => vi.advanceTimersByTimeAsync(149));
		expect(card('Ava Chen, @ava')).toBeInTheDocument();
		await act(() => vi.advanceTimersByTimeAsync(1));
		expect(card('Ava Chen, @ava')).not.toBeInTheDocument();

		await fireEvent.pointerEnter(ben().parentElement!, mouse);
		await flush();
		expect(card('Ben Ortiz, @ben')).toBeInTheDocument();
	});

	test('keys toggle it, Escape closes it and returns focus without reopening', async () => {
		render(Harness);
		await fireEvent.click(ava(), { detail: 0 });
		expect(card('Ava Chen, @ava')).toBeInTheDocument();
		await fireEvent.click(ava(), { detail: 0 });
		await flush();
		expect(card('Ava Chen, @ava')).not.toBeInTheDocument();

		await fireEvent.click(ava(), { detail: 0 });
		const follow = screen.getByRole('button', { name: 'Follow Ava' });
		follow.focus();
		await fireEvent.keyDown(follow, { key: 'Escape' });
		await flush();
		expect(card('Ava Chen, @ava')).not.toBeInTheDocument();
		expect(ava()).toHaveFocus();
	});

	test('a press anywhere else closes it', async () => {
		render(Harness);
		await fireEvent.click(ava(), { detail: 0 });
		await fireEvent.pointerDown(screen.getByRole('button', { name: 'Elsewhere' }));
		await flush();
		expect(card('Ava Chen, @ava')).not.toBeInTheDocument();
	});
});
