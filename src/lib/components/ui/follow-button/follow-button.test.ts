import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import FollowButton from './follow-button.svelte';

// jsdom has no Web Animations API; Svelte transitions finish on the next microtask.
const nativeAnimate = Element.prototype.animate;
function fakeAnimate() {
	return {
		cancel() {},
		set onfinish(done: () => void) {
			queueMicrotask(done);
		}
	} as unknown as Animation;
}

beforeEach(() => {
	Element.prototype.animate = fakeAnimate;
	vi.useFakeTimers();
	// Labels are measured with bind:offsetWidth, which needs a ResizeObserver.
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		}
	);
});

afterEach(() => {
	Element.prototype.animate = nativeAnimate;
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
const word = (button: HTMLElement) =>
	button.querySelector('[aria-hidden="true"].grid > span:not(.invisible)')?.textContent?.trim();

function setup(props: Record<string, unknown> = {}) {
	const onFollowingChange = vi.fn();
	const result = render(FollowButton, { name: 'Research agent', onFollowingChange, ...props });
	const button = screen.getByRole('button', { name: 'Follow Research agent' });
	return { ...result, button, onFollowingChange };
}

describe('FollowButton', () => {
	test('is a toggle named for who it follows', () => {
		const { button } = setup();
		expect(button).toHaveAttribute('type', 'button');
		expect(button).toHaveAttribute('aria-pressed', 'false');
		expect(word(button)).toBe('Follow');
	});

	test('following reports the change and swaps the word, keeping the name', async () => {
		const { button, onFollowingChange } = setup();
		await fireEvent.click(button);
		await advance(0);
		expect(onFollowingChange).toHaveBeenCalledWith(true);
		expect(button).toHaveAttribute('aria-pressed', 'true');
		expect(button).toHaveAttribute('data-state', 'following');
		expect(word(button)).toBe('Following');
		expect(button).toHaveAccessibleName('Follow Research agent');
	});

	test('morphs the plus into a check', async () => {
		const { button } = setup();
		const lines = () =>
			[...button.querySelectorAll('line')].map((line) => line.getAttribute('x1')).join(',');
		expect(lines()).toBe('12,5');
		await fireEvent.click(button);
		await advance(1000);
		expect(lines()).toBe('5.5,10');
	});

	test('warns before unfollowing once the pointer rests on a followed button', async () => {
		const { button } = setup({ following: true });
		await fireEvent.pointerEnter(button, { pointerType: 'mouse' });
		await advance(200);
		expect(button).toHaveAttribute('data-state', 'following');
		await advance(300);
		expect(button).toHaveAttribute('data-state', 'unfollow');
		expect(word(button)).toBe('Unfollow');

		await fireEvent.pointerLeave(button, { pointerType: 'mouse' });
		expect(button).toHaveAttribute('data-state', 'following');
	});

	test('sweeping past never shows the warning', async () => {
		const { button } = setup({ following: true });
		await fireEvent.pointerEnter(button, { pointerType: 'mouse' });
		await advance(150);
		await fireEvent.pointerLeave(button, { pointerType: 'mouse' });
		await advance(1000);
		expect(button).toHaveAttribute('data-state', 'following');
	});

	test('right after following, the pointer has to leave before the warning can show', async () => {
		const { button } = setup();
		await fireEvent.pointerEnter(button, { pointerType: 'mouse' });
		await fireEvent.click(button);
		await fireEvent.pointerEnter(button, { pointerType: 'mouse' });
		await advance(1000);
		expect(button).toHaveAttribute('data-state', 'following');

		await fireEvent.pointerLeave(button, { pointerType: 'mouse' });
		await fireEvent.pointerEnter(button, { pointerType: 'mouse' });
		await advance(1000);
		expect(button).toHaveAttribute('data-state', 'unfollow');

		await fireEvent.click(button);
		expect(button).toHaveAttribute('aria-pressed', 'false');
		expect(button).toHaveAttribute('data-state', 'follow');
	});

	test('following from the keyboard leaves the first hover armed', async () => {
		const { button } = setup();
		await fireEvent.click(button, { detail: 0 });
		expect(button).toHaveAttribute('aria-pressed', 'true');
		await fireEvent.pointerEnter(button, { pointerType: 'mouse' });
		await advance(1000);
		expect(button).toHaveAttribute('data-state', 'unfollow');
	});

	test('touch never shows the warning', async () => {
		const { button } = setup({ following: true });
		await fireEvent.pointerEnter(button, { pointerType: 'touch' });
		await advance(1000);
		expect(button).toHaveAttribute('data-state', 'following');
	});

	test('uses custom labels', async () => {
		render(FollowButton, { label: 'Subscribe', followingLabel: 'Subscribed' });
		const button = screen.getByRole('button', { name: 'Subscribe' });
		await fireEvent.click(button);
		await advance(0);
		expect(word(button)).toBe('Subscribed');
	});

	test('does nothing while disabled and clears its timer when destroyed', async () => {
		const { button, onFollowingChange, unmount } = setup({ following: true, disabled: true });
		expect(button).toBeDisabled();
		await fireEvent.click(button);
		expect(onFollowingChange).not.toHaveBeenCalled();
		unmount();
		expect(vi.getTimerCount()).toBe(0);
	});
});
