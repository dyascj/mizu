import { fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import DotGrid from './dot-grid.svelte';

let frames: FrameRequestCallback[] = [];
let now = 0;
let visibility: ((entries: { isIntersecting: boolean }[]) => void) | null = null;
const disconnected = vi.fn();

function runFrames(count: number) {
	for (let i = 0; i < count; i++) {
		const queue = frames;
		frames = [];
		now += 1000 / 60;
		for (const callback of queue) callback(now);
	}
}

/** A 2D context that only counts the dots it is asked to draw. */
function fakeContext() {
	const ctx = {
		arcs: 0,
		alphas: [] as number[],
		set globalAlpha(value: number) {
			ctx.alphas.push(value);
		},
		fillStyle: '',
		setTransform() {},
		clearRect() {
			ctx.arcs = 0;
		},
		beginPath() {},
		moveTo() {},
		arc() {
			ctx.arcs++;
		},
		fill() {}
	};
	return ctx;
}

function stubReducedMotion(reduce: boolean) {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: query.includes('reduce') ? reduce : false,
		media: query,
		addEventListener() {},
		removeEventListener() {}
	}));
}

let ctx: ReturnType<typeof fakeContext>;

beforeEach(() => {
	frames = [];
	now = 1000;
	vi.spyOn(performance, 'now').mockImplementation(() => now);
	disconnected.mockReset();
	stubReducedMotion(false);
	ctx = fakeContext();
	vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
		ctx as unknown as CanvasRenderingContext2D
	);
	// A 160 by 96 panel: 10 by 6 dots at the default 16px spacing.
	vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(160);
	vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(96);
	vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
		left: 0,
		top: 0
	} as DOMRect);
	vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback));
	vi.stubGlobal('cancelAnimationFrame', (id: number) => {
		if (id) frames = [];
	});
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			disconnect = disconnected;
		}
	);
	vi.stubGlobal(
		'IntersectionObserver',
		class {
			constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
				visibility = callback;
			}
			observe() {}
			disconnect = disconnected;
		}
	);
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

function setup() {
	const children = createRawSnippet(() => ({ render: () => '<h2>Ask anything</h2>' }));
	const result = render(DotGrid, { children });
	const surface = result.container.firstElementChild as HTMLElement;
	return { ...result, surface };
}

describe('DotGrid', () => {
	test('hides the decorative canvas and draws a still grid without a loop', () => {
		const { container } = setup();
		expect(container.querySelector('canvas')).toHaveAttribute('aria-hidden', 'true');
		expect(screen.getByRole('heading', { name: 'Ask anything' })).toBeInTheDocument();
		expect(ctx.arcs).toBe(60);
		expect(frames).toHaveLength(0);
	});

	test('wakes for the pointer and sleeps once the dots settle', async () => {
		const { surface } = setup();
		await fireEvent.pointerMove(surface, { clientX: 80, clientY: 48, pointerType: 'mouse' });
		expect(frames).toHaveLength(1);
		runFrames(5);
		// Dots near the pointer get a second, brighter pass.
		expect(ctx.arcs).toBeGreaterThan(60);

		await fireEvent.pointerLeave(surface);
		runFrames(600);
		expect(frames).toHaveLength(0);
		expect(ctx.arcs).toBe(60);
	});

	test('a click sends a ring through the grid, and the loop stops offscreen', async () => {
		const { surface } = setup();
		await fireEvent.pointerDown(surface, { clientX: 0, clientY: 0, button: 0 });
		runFrames(3);
		expect(frames).toHaveLength(1);
		visibility?.([{ isIntersecting: false }]);
		expect(frames).toHaveLength(0);
	});

	test('ignores touch movement', async () => {
		const { surface } = setup();
		await fireEvent.pointerMove(surface, { clientX: 80, clientY: 48, pointerType: 'touch' });
		expect(frames).toHaveLength(0);
	});

	test('holds still under reduced motion: no shockwave, dots only light up', async () => {
		stubReducedMotion(true);
		const { surface } = setup();
		await fireEvent.pointerDown(surface, { clientX: 80, clientY: 48, button: 0 });
		expect(frames).toHaveLength(0);
		await fireEvent.pointerMove(surface, { clientX: 80, clientY: 48, pointerType: 'mouse' });
		runFrames(1);
		expect(ctx.arcs).toBeGreaterThan(60);
		expect(frames).toHaveLength(0);
	});

	test('disconnects its resize and visibility observers', () => {
		const { unmount } = setup();
		unmount();
		expect(disconnected).toHaveBeenCalledTimes(2);
	});
});
