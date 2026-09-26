import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import StarButton from './star-button.svelte';

function stubReducedMotion(reduce: boolean) {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: reduce && query.includes('reduce'),
		media: query,
		addEventListener() {},
		removeEventListener() {}
	}));
}

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
	// jsdom has no layout, so the label widths are never measured.
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

const sparks = (container: HTMLElement) => container.querySelectorAll('.star-spark');
const rotations = () =>
	animate.mock.calls.filter(([frames]) => 'rotate' in (frames as PropertyIndexedKeyframes));

describe('StarButton', () => {
	test('keeps one name while the visible label changes', async () => {
		render(StarButton, { count: 1299, locale: 'en-US' });
		const button = screen.getByRole('button', { name: 'Star 1,299' });
		expect(button).toHaveAttribute('aria-pressed', 'false');
		await fireEvent.click(button);
		expect(button).toHaveAttribute('aria-pressed', 'true');
		expect(button).toHaveAccessibleName(/^Star /);
		expect(button.querySelector('[aria-hidden="true"].relative.h-5')).toHaveTextContent('Starred');
	});

	test('starring spins the star once and throws eight sparks', async () => {
		const onStarredChange = vi.fn();
		const { container } = render(StarButton, { count: 4, onStarredChange });
		await fireEvent.click(screen.getByRole('button'));
		expect(onStarredChange).toHaveBeenCalledWith(true);
		expect(rotations()).toHaveLength(1);
		expect(sparks(container)).toHaveLength(8);
	});

	test('a star that arrives with loaded data stays quiet', async () => {
		const { container, rerender } = render(StarButton, { starred: false });
		await rerender({ starred: true });
		expect(rotations()).toHaveLength(0);
		expect(sparks(container)).toHaveLength(0);
	});

	test('unstarring stays quiet', async () => {
		const { container } = render(StarButton, { starred: true, count: 5 });
		await fireEvent.click(screen.getByRole('button'));
		expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
		expect(rotations()).toHaveLength(0);
		expect(sparks(container)).toHaveLength(0);
	});

	test('reduced motion stars without spinning or sparks', async () => {
		stubReducedMotion(true);
		const { container } = render(StarButton, {});
		await fireEvent.click(screen.getByRole('button'));
		expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
		expect(rotations()).toHaveLength(0);
		expect(sparks(container)).toHaveLength(0);
	});

	test('takes custom labels and hides the count when there is none', () => {
		render(StarButton, { label: 'Save', starredLabel: 'Saved' });
		expect(screen.getByRole('button', { name: 'Save' })).not.toHaveTextContent(/\d/);
	});
});
