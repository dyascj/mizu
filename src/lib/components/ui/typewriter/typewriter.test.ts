import { act, render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Typewriter from './typewriter.svelte';

function stubReducedMotion(reduce: boolean) {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: reduce && query.includes('reduce'),
		media: query,
		addEventListener() {},
		removeEventListener() {}
	}));
}

beforeEach(() => {
	stubReducedMotion(false);
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
const words = ['plan a trip', 'fix my SQL'];
/** The visible, typed line (the reserved sizer is the invisible twin). */
const shown = (container: HTMLElement) =>
	container.querySelector('[aria-hidden="true"]:not(.invisible)')?.textContent;
const root = (container: HTMLElement) => container.firstElementChild as HTMLElement;

describe('Typewriter', () => {
	test('gives screen readers the whole sentence once, never the keystrokes', () => {
		const { container } = render(Typewriter, { prefix: 'Ask me to', words });
		expect(container.querySelector('.sr-only')).toHaveTextContent(
			'Ask me to plan a trip or fix my SQL'
		);
		for (const layer of container.querySelectorAll('.sr-only ~ span')) {
			expect(layer).toHaveAttribute('aria-hidden', 'true');
		}
	});

	test('starts on the finished first word, as the server rendered it', () => {
		const { container } = render(Typewriter, { prefix: 'Ask me to', words });
		expect(shown(container)).toBe('Ask me to plan a trip');
		expect(container.querySelector('.typewriter-ink')).toBeNull();
	});

	test('holds, selects the word, then types the next one over it', async () => {
		const { container } = render(Typewriter, { prefix: 'Ask me to', words, hold: 1000 });

		await advance(1000);
		expect(root(container)).toHaveAttribute('data-selecting', 'true');
		expect(shown(container)).toBe('Ask me to plan a trip');

		// The first key replaces the whole selection.
		await advance(560);
		expect(root(container)).toHaveAttribute('data-selecting', 'false');
		expect(root(container)).toHaveAttribute('data-typing', 'true');
		expect(shown(container)).toBe('Ask me to f');
		expect(container.querySelector('.typewriter-ink')).not.toBeNull();

		await advance(2000);
		expect(shown(container)).toBe('Ask me to fix my SQL');
		expect(root(container)).toHaveAttribute('data-typing', 'false');
	});

	test('pausing finishes the current word and holds it', async () => {
		const { container, rerender } = render(Typewriter, { words, hold: 500 });
		await advance(500 + 560 + 150);
		expect(shown(container)?.length).toBeLessThan('fix my SQL'.length);

		await rerender({ paused: true });
		expect(shown(container)).toBe('fix my SQL');
		expect(root(container)).toHaveAttribute('data-paused');
		expect(vi.getTimerCount()).toBe(0);
		await advance(5000);
		expect(shown(container)).toBe('fix my SQL');

		await rerender({ paused: false });
		await advance(500);
		expect(root(container)).toHaveAttribute('data-selecting', 'true');
	});

	test('swaps whole words for reduced motion, without typing', async () => {
		stubReducedMotion(true);
		const { container } = render(Typewriter, { words, hold: 1000 });
		await advance(0);
		const options = () =>
			Array.from(container.querySelectorAll('.inline-grid .inline-grid > span'), (node) =>
				node.classList.contains('opacity-0')
			);
		expect(options()).toEqual([false, true]);
		await advance(1600);
		expect(options()).toEqual([true, false]);
		expect(container.querySelector('.typewriter-caret:not(.invisible *)')).toBeNull();
	});

	test('takes a custom label and cleans up its timers', async () => {
		const { container, unmount } = render(Typewriter, {
			words,
			label: 'Example prompts'
		});
		expect(container.querySelector('.sr-only')).toHaveTextContent('Example prompts');
		await advance(10);
		unmount();
		expect(vi.getTimerCount()).toBe(0);
	});
});
