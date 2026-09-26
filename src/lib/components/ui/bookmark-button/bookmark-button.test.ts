import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import BookmarkButton from './bookmark-button.svelte';

// jsdom has no Web Animations API; record calls and finish on the next microtask.
const nativeAnimate = Element.prototype.animate;
const animate = vi.fn<Element['animate']>(function fakeAnimate() {
	return {
		cancel() {},
		playState: 'running',
		set onfinish(done: () => void) {
			queueMicrotask(done);
		}
	} as unknown as Animation;
});

beforeEach(() => {
	Element.prototype.animate = animate;
	animate.mockClear();
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
	vi.unstubAllGlobals();
});

const fill = (button: HTMLElement) =>
	button.querySelector('[data-slot="bookmark-fill"]')?.getAttribute('class') ?? '';

describe('BookmarkButton', () => {
	test('is a toggle with a fixed name, and the visible label swaps', async () => {
		render(BookmarkButton);
		const button = screen.getByRole('button', { name: 'Save' });
		expect(button).toHaveAttribute('type', 'button');
		expect(button).toHaveAttribute('aria-pressed', 'false');

		await fireEvent.click(button);
		expect(button).toHaveAttribute('aria-pressed', 'true');
		expect(screen.getByRole('button', { name: 'Save' })).toBe(button);
		const words = [...button.querySelectorAll('[aria-hidden] > span:not(.invisible)')];
		expect(words.find((word) => word.textContent === 'Saved')).toHaveClass('opacity-100');
		expect(words.find((word) => word.textContent === 'Save')).toHaveClass('opacity-0');
	});

	test('saving reports the change, fills from the bottom, and lands with a hop', async () => {
		const onSavedChange = vi.fn();
		render(BookmarkButton, { onSavedChange });
		const button = screen.getByRole('button', { name: 'Save' });
		expect(fill(button)).toContain('inset(85%');

		await fireEvent.click(button);
		expect(onSavedChange).toHaveBeenCalledWith(true);
		expect(fill(button)).toContain('inset(12%');
		expect(animate).toHaveBeenCalledTimes(1);
		const [keyframes] = animate.mock.calls[0] as [Keyframe[]];
		expect(keyframes.map((frame) => frame.scale)).toEqual(['1 1', '0.97 1.04', '1.04 0.95', '1 1']);

		await fireEvent.click(button);
		expect(onSavedChange).toHaveBeenLastCalledWith(false);
		expect(fill(button)).toContain('inset(85%');
	});

	test('shows a count in place of the label and names the button with it', async () => {
		const { rerender } = render(BookmarkButton, { count: 127, locale: 'en-US' });
		const button = screen.getByRole('button', { name: 'Save 127' });
		await fireEvent.click(button);
		await rerender({ count: 128, saved: true });
		expect(screen.getByRole('button', { name: 'Save 128' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
	});

	test('follows the saved prop', async () => {
		const { rerender } = render(BookmarkButton, { saved: true });
		expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('aria-pressed', 'true');
		await rerender({ saved: false });
		expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('aria-pressed', 'false');
	});

	test('skips the hop under reduced motion', async () => {
		vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
		render(BookmarkButton);
		await fireEvent.click(screen.getByRole('button', { name: 'Save' }));
		expect(animate).not.toHaveBeenCalled();
	});

	test('does nothing while disabled', async () => {
		const onSavedChange = vi.fn();
		render(BookmarkButton, { disabled: true, onSavedChange });
		const button = screen.getByRole('button', { name: 'Save' });
		expect(button).toBeDisabled();
		await fireEvent.click(button);
		expect(onSavedChange).not.toHaveBeenCalled();
	});
});
