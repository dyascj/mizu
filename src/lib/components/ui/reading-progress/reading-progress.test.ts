import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import ReadingProgress from './reading-progress.svelte';

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
	vi.useFakeTimers();
	Element.prototype.animate = fakeAnimate;
});

afterEach(() => {
	vi.useRealTimers();
	Element.prototype.animate = nativeAnimate;
});

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

/** A scroller with 800px of travel. */
function scroller(text = '') {
	const el = document.createElement('div');
	el.textContent = text;
	Object.defineProperty(el, 'scrollHeight', { value: 1000 });
	Object.defineProperty(el, 'clientHeight', { value: 200 });
	document.body.append(el);
	return el;
}

async function scrollTo(el: HTMLElement, top: number) {
	el.scrollTop = top;
	await fireEvent.scroll(el);
	await advance(300);
}

const bar = (container: HTMLElement) =>
	container.querySelector<HTMLElement>('[aria-hidden="true"]')!.style.scale;

describe('ReadingProgress', () => {
	test('counts down the minutes left and fills the bar as the reader scrolls', async () => {
		const target = scroller();
		const { container } = render(ReadingProgress, { props: { target, words: 1100 } });
		expect(screen.getByText('5 min left')).toBeInTheDocument();
		expect(bar(container)).toBe('0 1');

		await scrollTo(target, 400);
		expect(bar(container)).toBe('0.5 1');
		expect(screen.getByText('3 min left')).toBeInTheDocument();

		await scrollTo(target, 798);
		expect(screen.getByText('Finished')).toBeInTheDocument();
	});

	test('never shows zero minutes before the end', async () => {
		const target = scroller();
		render(ReadingProgress, { props: { target, words: 200 } });
		await scrollTo(target, 700);
		expect(screen.getByText('1 min left')).toBeInTheDocument();
	});

	test('counts the words in the scroller when not told', async () => {
		const target = scroller(Array.from({ length: 660 }, () => 'word').join(' '));
		render(ReadingProgress, { props: { target } });
		await advance(20);
		expect(screen.getByText('3 min left')).toBeInTheDocument();
	});

	test('takes custom labels, a reading speed, and leading content', async () => {
		const target = scroller();
		render(ReadingProgress, {
			props: {
				target,
				words: 1000,
				wordsPerMinute: 100,
				remainingLabel: (minutes: number) => `${minutes} minutes to go`,
				finishedLabel: 'All read',
				children: createRawSnippet(() => ({ render: () => '<span>Research brief</span>' }))
			}
		});
		expect(screen.getByText('Research brief')).toBeInTheDocument();
		expect(screen.getByText('10 minutes to go')).toBeInTheDocument();
		await scrollTo(target, 800);
		expect(screen.getByText('All read')).toBeInTheDocument();
	});

	test('can keep only the bar', () => {
		render(ReadingProgress, { props: { target: scroller(), words: 1000, hideLabel: true } });
		expect(screen.queryByText(/min left/)).toBeNull();
	});

	test('follows the page when no target is given', async () => {
		Object.defineProperty(document.documentElement, 'scrollHeight', {
			value: 2000,
			configurable: true
		});
		vi.stubGlobal('innerHeight', 1000);
		const { container } = render(ReadingProgress, { props: { words: 440 } });
		vi.stubGlobal('scrollY', 500);
		await fireEvent.scroll(window);
		await advance(300);
		expect(bar(container)).toBe('0.5 1');
		expect(screen.getByText('1 min left')).toBeInTheDocument();
		vi.unstubAllGlobals();
	});
});
