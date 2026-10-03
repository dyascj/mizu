import { fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import ImageHotspots from './image-hotspots.svelte';
import { place } from './placement.js';

const image = createRawSnippet(() => ({ render: () => '<svg data-testid="picture"></svg>' }));
const hotspots = [
	{ x: 0.2, y: 0.1, title: 'Model picker', body: 'Switch models mid-chat.' },
	{ x: 0.5, y: 0.6, title: 'Sources', body: 'Every claim links to where it came from.' },
	{ x: 0.8, y: 0.9, title: 'Voice mode', body: 'Talk it through hands-free.' }
];

// jsdom has neither layout nor the Web Animations API. The stage reports a
// fixed size through a stand-in ResizeObserver, and transitions end at once.
const nativeAnimate = Element.prototype.animate;
beforeEach(() => {
	Element.prototype.animate = function () {
		return {
			cancel() {},
			set onfinish(done: () => void) {
				queueMicrotask(done);
			}
		} as unknown as Animation;
	};
	vi.stubGlobal(
		'ResizeObserver',
		class {
			constructor(private callback: ResizeObserverCallback) {}
			observe() {
				this.callback(
					[{ contentRect: { width: 640, height: 400 } } as ResizeObserverEntry],
					this as unknown as ResizeObserver
				);
			}
			disconnect() {}
		}
	);
});
afterEach(() => {
	Element.prototype.animate = nativeAnimate;
	vi.unstubAllGlobals();
});

const props = { hotspots, image, label: 'Chat screen tour' };
const card = (container: HTMLElement) => container.querySelector('[aria-live="polite"]')!;

describe('ImageHotspots', () => {
	test('is a labelled figure with one named button per point and a single tab stop', () => {
		render(ImageHotspots, props);
		expect(screen.getByRole('group', { name: 'Chat screen tour' })).toBeInTheDocument();
		const buttons = screen.getAllByRole('button');
		expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
			'Model picker',
			'Sources',
			'Voice mode'
		]);
		expect(buttons.filter((button) => button.tabIndex === 0)).toHaveLength(1);
		expect(screen.getByTestId('picture').parentElement).toHaveAttribute('aria-hidden', 'true');
	});

	test('a click opens the card for that point and a second click puts it away', async () => {
		const onActiveChange = vi.fn();
		const { container } = render(ImageHotspots, { ...props, onActiveChange });
		const sources = screen.getByRole('button', { name: 'Sources' });

		await fireEvent.click(sources);
		expect(sources).toHaveAttribute('aria-expanded', 'true');
		expect(onActiveChange).toHaveBeenLastCalledWith(1);
		expect(card(container)).toHaveTextContent('02 / 03');
		expect(card(container)).toHaveTextContent('Every claim links to where it came from.');
		expect(sources).toHaveAttribute('aria-controls', card(container).id);

		await fireEvent.click(sources);
		expect(sources).toHaveAttribute('aria-expanded', 'false');
		expect(onActiveChange).toHaveBeenLastCalledWith(null);
		expect(card(container)).toHaveAttribute('aria-hidden', 'true');
	});

	test('arrow keys travel between points, and Escape closes and returns focus', async () => {
		const { container } = render(ImageHotspots, { ...props, active: 0 });
		const buttons = screen.getAllByRole('button');
		buttons[0].focus();

		await fireEvent.keyDown(buttons[0], { key: 'ArrowRight' });
		expect(buttons[1]).toHaveFocus();
		expect(buttons[1]).toHaveAttribute('aria-expanded', 'true');
		expect(buttons[1]).toHaveAttribute('tabindex', '0');

		await fireEvent.keyDown(buttons[1], { key: 'End' });
		expect(card(container)).toHaveTextContent('Voice mode');
		await fireEvent.keyDown(buttons[2], { key: 'ArrowDown' });
		expect(buttons[0]).toHaveAttribute('aria-expanded', 'true');

		await fireEvent.keyDown(buttons[0], { key: 'Escape' });
		expect(buttons[0]).toHaveAttribute('aria-expanded', 'false');
		expect(buttons[0]).toHaveFocus();
	});

	test('right to left, ArrowLeft moves on through the reading order', async () => {
		document.body.style.direction = 'rtl';
		try {
			render(ImageHotspots, { ...props, active: 0 });
			const buttons = screen.getAllByRole('button');
			buttons[0].focus();
			await fireEvent.keyDown(buttons[0], { key: 'ArrowLeft' });
			expect(buttons[1]).toHaveFocus();
			await fireEvent.keyDown(buttons[1], { key: 'ArrowRight' });
			expect(buttons[0]).toHaveFocus();
		} finally {
			document.body.style.direction = '';
		}
	});

	test('keeps a tab stop when the points shrink under the focused one', async () => {
		const { rerender } = render(ImageHotspots, props);
		await fireEvent.focus(screen.getByRole('button', { name: 'Voice mode' }));
		expect(screen.getByRole('button', { name: 'Voice mode' })).toHaveAttribute('tabindex', '0');
		await rerender({ ...props, hotspots: hotspots.slice(0, 2) });
		const buttons = screen.getAllByRole('button');
		expect(buttons.filter((button) => button.tabIndex === 0)).toHaveLength(1);
		expect(buttons[1]).toHaveAttribute('tabindex', '0');
	});

	test('the card grows with its words, and scrolls past its cap instead of cutting them off', async () => {
		let words = 60;
		// Keeps every observer, so a change in the words can be reported to them.
		const observers: (() => void)[] = [];
		vi.stubGlobal(
			'ResizeObserver',
			class {
				constructor(private callback: ResizeObserverCallback) {}
				observe() {
					const report = () =>
						this.callback(
							[{ contentRect: { width: 640, height: 400 } } as ResizeObserverEntry],
							this as unknown as ResizeObserver
						);
					observers.push(report);
					report();
				}
				disconnect() {}
			}
		);
		const native = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')!;
		Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
			configurable: true,
			get(this: HTMLElement) {
				return this.dataset.slot === 'image-hotspots-content' ? words : 0;
			}
		});
		try {
			const { container, rerender } = render(ImageHotspots, { ...props, active: 1 });
			await Promise.resolve();
			const box = card(container) as HTMLElement;
			// 60px of words plus 14px of padding above and below.
			expect(box.style.height).toBe('88px');
			expect(box).not.toHaveAttribute('tabindex');

			words = 500;
			await rerender({ ...props, active: 2 });
			observers.forEach((report) => report());
			await Promise.resolve();
			// Capped at 280px, it scrolls, and takes focus so the keyboard can scroll it.
			expect(box.style.height).toBe('280px');
			expect(box).toHaveClass('overflow-y-auto');
			expect(box).toHaveAttribute('tabindex', '0');
		} finally {
			Object.defineProperty(HTMLElement.prototype, 'offsetHeight', native);
		}
	});

	test('arrow keys on the card scroll its words instead of moving to another point', async () => {
		const { container } = render(ImageHotspots, { ...props, active: 1 });
		await Promise.resolve();
		const box = card(container) as HTMLElement;
		const sources = screen.getByRole('button', { name: 'Sources' });
		// fireEvent returns false when a handler called preventDefault.
		expect(await fireEvent.keyDown(box, { key: 'ArrowDown' })).toBe(true);
		expect(sources).toHaveAttribute('aria-expanded', 'true');
		// Escape still puts the card away.
		await fireEvent.keyDown(box, { key: 'Escape' });
		expect(sources).toHaveAttribute('aria-expanded', 'false');
	});

	test('a caller onkeydown runs first and can take over a key', async () => {
		const onkeydown = vi.fn((event: KeyboardEvent) => {
			if (event.key === 'End') event.preventDefault();
		});
		render(ImageHotspots, { ...props, active: 0, onkeydown });
		const buttons = screen.getAllByRole('button');
		await fireEvent.keyDown(buttons[0], { key: 'End' });
		expect(onkeydown).toHaveBeenCalledOnce();
		expect(buttons[2]).toHaveAttribute('aria-expanded', 'false');
		await fireEvent.keyDown(buttons[0], { key: 'ArrowRight' });
		expect(buttons[1]).toHaveAttribute('aria-expanded', 'true');
	});

	test('a press outside the stage puts the card away', async () => {
		render(ImageHotspots, { ...props, active: 1 });
		expect(screen.getByRole('button', { name: 'Sources' })).toHaveAttribute(
			'aria-expanded',
			'true'
		);
		await fireEvent.pointerDown(document.body);
		expect(screen.getByRole('button', { name: 'Sources' })).toHaveAttribute(
			'aria-expanded',
			'false'
		);
	});
});

describe('place', () => {
	test('prefers the side with room, clear of the subject', () => {
		const subject = { x: 200, y: 0, w: 240, h: 400 };
		const spot = place(420, 200, 640, 400, 188, 136, [], subject);
		expect(spot.side).toBe('right');
		expect(spot.x).toBeGreaterThanOrEqual(440);
	});

	test('never hides another point when it can help it', () => {
		const spot = place(100, 200, 640, 400, 188, 136, [{ x: 200, y: 200 }], null);
		const covers = (p: { x: number; y: number }) =>
			p.x > spot.x - 8 && p.x < spot.x + 188 + 8 && p.y > spot.y - 8 && p.y < spot.y + 136 + 8;
		expect(covers({ x: 200, y: 200 })).toBe(false);
	});
});
