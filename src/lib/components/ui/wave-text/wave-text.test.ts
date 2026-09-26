import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import WaveText from './wave-text.svelte';

function stubReducedMotion(reduce: boolean) {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: reduce && query.includes('reduce'),
		media: query,
		addEventListener() {},
		removeEventListener() {}
	}));
}

/** Lays the letters out in a row, 10px apart, as jsdom has no layout. */
function layOut(container: HTMLElement) {
	const letters = Array.from(container.querySelectorAll<HTMLElement>('[data-letter]'));
	letters.forEach((letter, i) => {
		Object.defineProperty(letter, 'offsetLeft', { value: i * 10, configurable: true });
		Object.defineProperty(letter, 'offsetWidth', { value: 10, configurable: true });
		Object.defineProperty(letter, 'offsetTop', { value: 0, configurable: true });
		Object.defineProperty(letter, 'offsetHeight', { value: 20, configurable: true });
	});
	return letters;
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
const lift = (letter: HTMLElement) => -parseFloat(letter.style.translate.split(' ')[1] || '0') || 0;

describe('WaveText', () => {
	test('reads the text once and keeps the letters away from assistive technology', () => {
		const { container } = render(WaveText, { text: 'Hi, I am listening', as: 'h2' });
		expect(screen.getByRole('heading', { level: 2, name: 'Hi, I am listening' })).toBeTruthy();
		expect(container.querySelector('[aria-hidden="true"]')?.textContent).toBe('Hi, I am listening');
		// Words never break inside, only between.
		expect(container.querySelectorAll('.whitespace-nowrap')).toHaveLength(4);
	});

	test('lifts the letters under the pointer most and lets them settle on leave', async () => {
		const { container, rerender } = render(WaveText, { text: 'Listening' });
		const letters = layOut(container);
		// Remeasure with the fake layout.
		await rerender({ text: 'Listening' });
		const root = container.firstElementChild as HTMLElement;
		root.getBoundingClientRect = () => DOMRect.fromRect({ x: 0, y: 0, width: 90, height: 20 });
		Object.defineProperty(root, 'offsetWidth', { value: 90, configurable: true });

		await fireEvent.pointerEnter(root, { clientX: 45, clientY: 10 });
		await fireEvent.pointerMove(root, { clientX: 45, clientY: 10 });
		await advance(1000);
		const middle = lift(letters[4]);
		expect(middle).toBeGreaterThan(0.1);
		expect(lift(letters[0])).toBeLessThan(middle / 10);

		await fireEvent.pointerLeave(root);
		await advance(2000);
		for (const letter of letters) expect(lift(letter)).toBe(0);
		expect(vi.getTimerCount()).toBe(0);
	});

	test('dims instead of lifting for reduced motion', async () => {
		stubReducedMotion(true);
		const { container, rerender } = render(WaveText, { text: 'Hello' });
		const letters = layOut(container);
		await rerender({ text: 'Hello' });
		const root = container.firstElementChild as HTMLElement;
		root.getBoundingClientRect = () => DOMRect.fromRect({ x: 0, y: 0, width: 50, height: 20 });
		Object.defineProperty(root, 'offsetWidth', { value: 50, configurable: true });

		await fireEvent.pointerMove(root, { clientX: 5, clientY: 10 });
		await advance(50);
		expect(letters[0].style.translate).toBe('');
		expect(letters[0].style.color).toBe('');
		expect(letters[4].style.color).toContain('muted-foreground');
	});

	test('cleans up its frames and listeners when destroyed', async () => {
		const { container, unmount } = render(WaveText, { text: 'Wave' });
		const root = container.firstElementChild as HTMLElement;
		await fireEvent.pointerMove(root, { clientX: 5, clientY: 5 });
		unmount();
		expect(vi.getTimerCount()).toBe(0);
	});
});
