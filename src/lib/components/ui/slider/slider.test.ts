import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Slider from './slider.svelte';

// bits-ui measures the track with a ResizeObserver, which jsdom lacks.
class NoopResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
}

// jsdom has no PointerEvent, so pointer events would lose their coordinates.
class PointerEventWithCoordinates extends MouseEvent {
	pointerId: number;
	constructor(type: string, init: PointerEventInit = {}) {
		super(type, init);
		this.pointerId = init.pointerId ?? 1;
	}
}

beforeEach(() => {
	vi.useFakeTimers();
	vi.stubGlobal('ResizeObserver', NoopResizeObserver);
	vi.stubGlobal('PointerEvent', PointerEventWithCoordinates);
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
const reduceMotion = () =>
	vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));

/** The position the thumb's spring last wrote, in percent. */
function thumbPosition(root: HTMLElement, index = 0) {
	return parseFloat(root.style.getPropertyValue(`--slider-thumb-${index}`));
}

describe('Slider', () => {
	test('steps from the keyboard and reports each value', async () => {
		const onValueChange = vi.fn();
		render(Slider, { type: 'single', value: 40, step: 10, 'aria-label': 'Volume', onValueChange });
		const thumb = screen.getByRole('slider', { name: 'Volume' });

		await fireEvent.keyDown(thumb, { key: 'ArrowRight' });
		expect(thumb).toHaveAttribute('aria-valuenow', '50');
		expect(onValueChange).toHaveBeenLastCalledWith(50);
		await fireEvent.keyDown(thumb, { key: 'Home' });
		expect(thumb).toHaveAttribute('aria-valuenow', '0');
	});

	test('glides the thumb to a new value instead of jumping', async () => {
		const { container } = render(Slider, {
			type: 'single',
			value: 50,
			step: 10,
			'aria-label': 'Volume'
		});
		const root = container.querySelector<HTMLElement>('[data-slider-root]')!;
		const thumb = screen.getByRole('slider');

		await fireEvent.keyDown(thumb, { key: 'ArrowRight' });
		await advance(16);
		const midway = thumbPosition(root);
		expect(midway).toBeGreaterThan(50);
		expect(midway).toBeLessThan(60);

		await advance(1000);
		expect(thumbPosition(root)).toBe(60);
		expect(root.querySelector('[data-slider-range]')?.getAttribute('style')).toContain(
			'var(--slider-range-end'
		);
	});

	test('jumps straight to the value under reduced motion', async () => {
		reduceMotion();
		const { container } = render(Slider, { type: 'single', value: 50, step: 10 });
		const root = container.querySelector<HTMLElement>('[data-slider-root]')!;
		await fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowRight' });
		expect(thumbPosition(root)).toBe(60);
	});

	test('names each thumb of a range and formats values for screen readers', () => {
		render(Slider, {
			type: 'multiple',
			value: [200, 750],
			min: 0,
			max: 1000,
			step: 10,
			'aria-label': 'Price',
			format: (value: number) => `$${value}`
		});
		const [low, high] = screen.getAllByRole('slider');
		expect(low).toHaveAccessibleName('Price 1');
		expect(high).toHaveAccessibleName('Price 2');
		expect(low).toHaveAttribute('aria-valuetext', '$200');
		expect(high).toHaveAttribute('aria-valuetext', '$750');
	});

	test('takes a name per thumb', () => {
		render(Slider, {
			type: 'multiple',
			value: [2, 15],
			'aria-label': 'Price',
			thumbLabels: ['Minimum price', 'Maximum price']
		});
		expect(screen.getByRole('slider', { name: 'Minimum price' })).toBeInTheDocument();
		expect(screen.getByRole('slider', { name: 'Maximum price' })).toBeInTheDocument();
	});

	test('shows a value bubble per thumb, hidden from screen readers', () => {
		const { container } = render(Slider, {
			type: 'multiple',
			value: [20, 60],
			showValue: true,
			format: (value: number) => `${value}%`
		});
		const bubbles = [...container.querySelectorAll('[data-slider-thumb] > [aria-hidden="true"]')];
		expect(bubbles.map((bubble) => bubble.textContent?.trim())).toEqual(['20%', '60%']);
	});

	test('with autoSort off, thumbs stop a step short of each other', async () => {
		const onValueChange = vi.fn();
		render(Slider, {
			type: 'multiple',
			value: [20, 40],
			step: 10,
			autoSort: false,
			'aria-label': 'Range',
			onValueChange
		});
		const [low, high] = screen.getAllByRole('slider');

		await fireEvent.keyDown(low, { key: 'ArrowRight' });
		expect(low).toHaveAttribute('aria-valuenow', '30');
		expect(onValueChange).toHaveBeenLastCalledWith([30, 40]);

		await fireEvent.keyDown(low, { key: 'End' });
		expect(low).toHaveAttribute('aria-valuenow', '30');
		expect(high).toHaveAttribute('aria-valuenow', '40');
		expect(onValueChange).toHaveBeenCalledTimes(1);
	});

	test('keeps trading places by default', async () => {
		render(Slider, { type: 'multiple', value: [20, 30], step: 10 });
		const [low] = screen.getAllByRole('slider');
		await fireEvent.keyDown(low, { key: 'End' });
		const values = screen
			.getAllByRole('slider')
			.map((thumb) => thumb.getAttribute('aria-valuenow'));
		expect(values).toEqual(['30', '100']);
	});

	test('an elastic track gives a nudge when a key pushes past the end, then springs back', async () => {
		const { container } = render(Slider, {
			type: 'single',
			value: 100,
			elastic: true,
			'aria-label': 'Volume'
		});
		const track = container.querySelector<HTMLElement>('[data-slider-root] > span')!;
		const thumb = screen.getByRole('slider');

		await fireEvent.keyDown(thumb, { key: 'ArrowRight' });
		expect(track.style.transform).toMatch(/^scale\(/);
		expect(track.style.transformOrigin).toBe('left');
		expect(thumb.style.transform).toMatch(/translateX\(\d/);

		await advance(2000);
		expect(track.style.transform).toBe('');
		expect(thumb.style.transform).toBe('');
	});

	test('stretches while dragged past the end and releases on pointer up', async () => {
		const { container } = render(Slider, {
			type: 'single',
			value: 50,
			elastic: true,
			'aria-label': 'Volume'
		});
		const root = container.querySelector<HTMLElement>('[data-slider-root]')!;
		const track = root.querySelector<HTMLElement>(':scope > span')!;
		root.getBoundingClientRect = () => DOMRect.fromRect({ x: 0, y: 0, width: 200, height: 20 });
		Object.defineProperty(track, 'offsetWidth', { value: 200 });

		await fireEvent.pointerDown(root, { button: 0, clientX: 100, clientY: 10 });
		await fireEvent.pointerMove(root, { clientX: 260, clientY: 10 });
		await fireEvent.pointerMove(root, { clientX: 280, clientY: 10 });
		expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '100');
		expect(track.style.transform).toMatch(/^scale\(1\.\d+, 0\.\d+\)$/);

		await fireEvent.pointerUp(root, { clientX: 280, clientY: 10 });
		await advance(2000);
		expect(track.style.transform).toBe('');
	});

	test('does not stretch unless elastic, or under reduced motion', async () => {
		const { container, rerender } = render(Slider, { type: 'single', value: 100 });
		const track = container.querySelector<HTMLElement>('[data-slider-root] > span')!;
		await fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowRight' });
		expect(track.style.transform).toBe('');

		reduceMotion();
		await rerender({ type: 'single', value: 100, elastic: true });
		await fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowRight' });
		expect(track.style.transform).toBe('');
	});
	test('runs a consumer pointer and key handler alongside its own', async () => {
		const onpointerdown = vi.fn();
		const onkeydowncapture = vi.fn();
		const { container } = render(Slider, {
			type: 'single',
			value: 100,
			'aria-label': 'Volume',
			elastic: true,
			onpointerdown,
			onkeydowncapture
		});
		const root = container.querySelector<HTMLElement>('[data-slider-root]')!;
		const track = root.querySelector<HTMLElement>('[data-orientation]')!;
		await fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowRight' });
		expect(onkeydowncapture).toHaveBeenCalledTimes(1);
		// The elastic nudge still ran.
		expect(track.style.transform).toMatch(/scale/);
		await fireEvent.pointerDown(root, { button: 0 });
		expect(onpointerdown).toHaveBeenCalledTimes(1);
	});

	test('draws the range from the thumbs that remain after one is removed', async () => {
		const { container, rerender } = render(Slider, {
			type: 'multiple',
			value: [20, 80],
			'aria-label': 'Price'
		});
		const root = container.querySelector<HTMLElement>('[data-slider-root]')!;
		await rerender({ type: 'multiple', value: [30, 70], 'aria-label': 'Price' });
		await advance(1000);
		await rerender({ type: 'multiple', value: [50], 'aria-label': 'Price' });
		await advance(1000);
		expect(root.style.getPropertyValue('--slider-range-start')).toBe('0%');
		expect(parseFloat(root.style.getPropertyValue('--slider-range-end'))).toBeCloseTo(50, 0);
	});
});
