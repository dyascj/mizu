import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import LikeButton from './like-button.svelte';

function stubReducedMotion(reduce: boolean) {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: reduce && query.includes('reduce'),
		media: query,
		addEventListener() {},
		removeEventListener() {}
	}));
}

// jsdom has no Web Animations API; record calls and finish on the next microtask.
const nativeAnimate = Element.prototype.animate;
const animate = vi.fn<Element['animate']>(function fakeAnimate() {
	return {
		cancel() {},
		set onfinish(done: () => void) {
			queueMicrotask(done);
		}
	} as unknown as Animation;
});

beforeEach(() => {
	Element.prototype.animate = animate;
	animate.mockClear();
	stubReducedMotion(false);
	vi.stubGlobal('requestAnimationFrame', () => 1);
});

afterEach(() => {
	Element.prototype.animate = nativeAnimate;
	vi.unstubAllGlobals();
});

const particles = (container: HTMLElement) => container.querySelectorAll('.like-particle');

describe('LikeButton', () => {
	test('is a toggle named by its label and count', () => {
		render(LikeButton, { count: 128, locale: 'en-US' });
		const button = screen.getByRole('button', { name: 'Like 128' });
		expect(button).toHaveAttribute('aria-pressed', 'false');
		expect(button).toHaveAttribute('type', 'button');
	});

	test('liking presses it, reports the change, pops the heart, and bursts', async () => {
		const onLikedChange = vi.fn();
		const { container } = render(LikeButton, { count: 128, onLikedChange });
		const button = screen.getByRole('button');

		await fireEvent.pointerDown(button, { button: 0 });
		await fireEvent.click(button);

		expect(button).toHaveAttribute('aria-pressed', 'true');
		expect(button).toHaveAttribute('data-state', 'on');
		expect(onLikedChange).toHaveBeenCalledWith(true);
		expect(particles(container)).toHaveLength(7);
		// The squash on the way down, then the pop that swells past full size.
		const [, pop] = animate.mock.calls.map(([frames]) => frames as Keyframe[]);
		expect(pop.some((frame) => Number(frame.scale) > 1)).toBe(true);
	});

	test('a keyboard like pops from the squash it never had', async () => {
		render(LikeButton, {});
		await fireEvent.click(screen.getByRole('button', { name: 'Like' }));
		const frames = animate.mock.calls[0][0] as Keyframe[];
		expect(frames[0].scale).toBe(0.8);
	});

	test('unliking stays quiet: no burst', async () => {
		const onLikedChange = vi.fn();
		const { container } = render(LikeButton, { liked: true, count: 129, onLikedChange });
		const button = screen.getByRole('button');
		await fireEvent.click(button);
		expect(button).toHaveAttribute('aria-pressed', 'false');
		expect(onLikedChange).toHaveBeenCalledWith(false);
		expect(particles(container)).toHaveLength(0);
	});

	test('the count follows the value the parent passes', async () => {
		const { rerender } = render(LikeButton, { count: 9, locale: 'en-US' });
		await rerender({ count: 10, liked: true });
		expect(screen.getByRole('button', { name: 'Like 10' })).toHaveAttribute('aria-pressed', 'true');
	});

	test('reduced motion toggles without scaling or particles', async () => {
		stubReducedMotion(true);
		const { container } = render(LikeButton, { count: 1 });
		const button = screen.getByRole('button');
		await fireEvent.pointerDown(button, { button: 0 });
		await fireEvent.click(button);
		expect(button).toHaveAttribute('aria-pressed', 'true');
		expect(animate).not.toHaveBeenCalled();
		expect(particles(container)).toHaveLength(0);
	});

	test('disabled does not toggle', async () => {
		const onLikedChange = vi.fn();
		render(LikeButton, { disabled: true, onLikedChange });
		await fireEvent.click(screen.getByRole('button'));
		expect(onLikedChange).not.toHaveBeenCalled();
	});
});
