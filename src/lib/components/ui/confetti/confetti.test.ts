import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { confetti, confettiBursts } from './confetti.js';
import ConfettiButton from './confetti-button.svelte';

const children = createRawSnippet(() => ({ render: () => '<span>Celebrate</span>' }));

// jsdom has no canvas or Web Animations API.
const nativeAnimate = Element.prototype.animate;
const nativeContext = HTMLCanvasElement.prototype.getContext;
const fillRect = vi.fn();

beforeEach(() => {
	vi.useFakeTimers();
	fillRect.mockClear();
	HTMLCanvasElement.prototype.getContext = (() => ({
		setTransform() {},
		clearRect() {},
		fillRect,
		globalAlpha: 1,
		fillStyle: ''
	})) as unknown as typeof HTMLCanvasElement.prototype.getContext;
	Element.prototype.animate = vi.fn(() => ({ cancel() {} }) as unknown as Animation);
});

afterEach(() => {
	HTMLCanvasElement.prototype.getContext = nativeContext;
	Element.prototype.animate = nativeAnimate;
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
const layer = () => document.querySelector('canvas[data-slot="confetti"]');
const reduceMotion = () =>
	vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));

describe('confetti', () => {
	test('draws a burst on one viewport canvas and removes it once the air is clear', async () => {
		expect(confetti({ x: 100, y: 100 }, confettiBursts.pop)).toBe(true);
		const canvas = layer();
		expect(canvas).toHaveAttribute('aria-hidden', 'true');
		await advance(50);
		expect(fillRect).toHaveBeenCalled();
		expect(confetti({ x: 10, y: 10 })).toBe(true);
		expect(document.querySelectorAll('canvas[data-slot="confetti"]')).toHaveLength(1);
		await advance(4000);
		expect(layer()).toBeNull();
		expect(vi.getTimerCount()).toBe(0);
	});

	test("resolves its colors in the origin's own theme", async () => {
		const island = document.createElement('div');
		const button = document.createElement('button');
		island.append(button);
		document.body.append(island);
		const scopes: (Element | null)[] = [];
		const real = window.getComputedStyle;
		vi.spyOn(window, 'getComputedStyle').mockImplementation((el, pseudo) => {
			scopes.push(el.parentElement);
			return real(el, pseudo);
		});
		confetti(button, confettiBursts.pop);
		expect(scopes.length).toBeGreaterThan(0);
		expect(scopes.every((scope) => scope === button)).toBe(true);
		// The probe that read them is gone.
		expect(button.childElementCount).toBe(0);

		scopes.length = 0;
		confetti({ x: 0, y: 0 }, confettiBursts.pop, { theme: island });
		expect(scopes.every((scope) => scope === island)).toBe(true);
		vi.restoreAllMocks();
		island.remove();
		// Let the air clear for the tests that follow.
		await advance(4000);
		expect(layer()).toBeNull();
	});

	test('throws nothing under reduced motion', () => {
		reduceMotion();
		expect(confetti({ x: 0, y: 0 }, confettiBursts.blast)).toBe(false);
		expect(layer()).toBeNull();
	});
});

describe('ConfettiButton', () => {
	function setup(props: Record<string, unknown> = {}) {
		const onCelebrate = vi.fn();
		const result = render(ConfettiButton, { children, onCelebrate, duration: 1000, ...props });
		const button = screen.getByRole('button', { name: 'Celebrate' });
		return { ...result, button, onCelebrate };
	}

	const fuse = (button: HTMLElement) =>
		button.querySelector<HTMLElement>('[data-slot="confetti-fuse"]')!.style.clipPath;

	test('describes the gesture and starts quiet', () => {
		const { button, container } = setup();
		expect(button).toHaveAttribute('type', 'button');
		expect(button).toHaveAccessibleDescription('Click to celebrate, or hold for a bigger one');
		expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe('');
	});

	test('a click pops', async () => {
		const { button, onCelebrate } = setup();
		await fireEvent.pointerDown(button, { button: 0, pointerId: 1 });
		await advance(50);
		await fireEvent.pointerUp(button, { pointerId: 1 });
		expect(onCelebrate).toHaveBeenCalledWith('pop');
		expect(layer()).not.toBeNull();
		await advance(4000);
	});

	test('holding burns the fuse and blasts at the end', async () => {
		const { button, onCelebrate, container } = setup();
		await fireEvent.pointerDown(button, { button: 0, pointerId: 1 });
		await advance(600);
		expect(button).toHaveAttribute('data-charging');
		expect(fuse(button)).not.toContain('inset(0 100%');
		expect(onCelebrate).not.toHaveBeenCalled();

		await advance(700);
		expect(onCelebrate).toHaveBeenCalledWith('blast');
		expect(button).not.toHaveAttribute('data-charging');
		expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe('Celebrated');
		expect(button).toHaveAccessibleName('Celebrate');

		// Letting go after the blast does not pop again.
		await fireEvent.pointerUp(button, { pointerId: 1 });
		expect(onCelebrate).toHaveBeenCalledTimes(1);
		await advance(4000);
	});

	test('letting go early still pops', async () => {
		const { button, onCelebrate } = setup();
		await fireEvent.pointerDown(button, { button: 0, pointerId: 1 });
		await advance(500);
		await fireEvent.pointerUp(button, { pointerId: 1 });
		expect(onCelebrate).toHaveBeenCalledWith('pop');
		expect(fuse(button)).toContain('inset(0 100%');
		await advance(4000);
	});

	test('holds from the keyboard, and key repeat never restarts the fuse', async () => {
		const { button, onCelebrate } = setup();
		await fireEvent.keyDown(button, { key: ' ' });
		await advance(700);
		await fireEvent.keyDown(button, { key: ' ', repeat: true });
		await advance(600);
		expect(onCelebrate).toHaveBeenCalledWith('blast');
		await fireEvent.keyUp(button, { key: ' ' });
		expect(onCelebrate).toHaveBeenCalledTimes(1);
		await advance(4000);
	});

	test('cancels when focus leaves mid-hold', async () => {
		const { button, onCelebrate } = setup();
		await fireEvent.keyDown(button, { key: 'Enter' });
		await advance(400);
		await fireEvent.blur(button);
		await advance(2000);
		expect(onCelebrate).not.toHaveBeenCalled();
	});

	test('assistive technology clicks pop', async () => {
		const { button, onCelebrate } = setup();
		await fireEvent.click(button, { detail: 0 });
		expect(onCelebrate).toHaveBeenCalledWith('pop');
		await advance(4000);
	});

	test('without hold every press pops', async () => {
		const { button, onCelebrate } = setup({ hold: false });
		expect(button).toHaveAccessibleDescription('Click to celebrate');
		await fireEvent.pointerDown(button, { button: 0, pointerId: 1 });
		await advance(3000);
		expect(onCelebrate).not.toHaveBeenCalled();
		await fireEvent.pointerUp(button, { pointerId: 1 });
		expect(onCelebrate).toHaveBeenCalledWith('pop');
		await advance(4000);
	});

	test('confirms with a check instead of confetti under reduced motion', async () => {
		reduceMotion();
		const { button, onCelebrate, container } = setup();
		await fireEvent.pointerDown(button, { button: 0, pointerId: 1 });
		await fireEvent.pointerUp(button, { pointerId: 1 });
		expect(onCelebrate).toHaveBeenCalledWith('pop');
		expect(layer()).toBeNull();
		expect(button).toHaveAttribute('data-celebrated');
		expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe('Celebrated');
	});

	test('stops its loops and timers when destroyed', async () => {
		const { button, unmount } = setup();
		await fireEvent.pointerDown(button, { button: 0, pointerId: 1 });
		await advance(1300);
		await advance(4000);
		unmount();
		expect(vi.getTimerCount()).toBe(0);
	});
});
