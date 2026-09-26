import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
	blurIn,
	cubicBezier,
	duration,
	easeOut,
	magnetic,
	pointerPosition,
	pop,
	reveal,
	rise,
	springs,
	stagger
} from './index.js';

function stubReducedMotion(reduce: boolean, finePointer = true) {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: query.includes('reduce') ? reduce : query.includes('pointer: fine') && finePointer,
		media: query,
		addEventListener() {},
		removeEventListener() {}
	}));
}

const theme = readFileSync('src/app.css', 'utf8');

function cssToken(name: string) {
	const match = theme.match(new RegExp(`--${name}:\\s*([^;]+);`));
	if (!match) throw new Error(`app.css does not define --${name}`);
	return match[1].trim();
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('easing', () => {
	test('cubic-bezier curves start at rest, end at rest, and match CSS semantics', () => {
		const linear = cubicBezier(0, 0, 1, 1);
		for (const t of [0, 0.25, 0.5, 0.75, 1]) expect(linear(t)).toBeCloseTo(t, 4);
		expect(easeOut(0)).toBe(0);
		expect(easeOut(1)).toBe(1);
		expect(easeOut(0.5)).toBeGreaterThan(0.85);
	});

	test('springs come to rest and the bouncy spring overshoots', () => {
		for (const spring of Object.values(springs)) {
			expect(spring.easing(0)).toBe(0);
			expect(spring.easing(1)).toBe(1);
		}
		const samples = Array.from({ length: 101 }, (_, i) => springs.bouncy.easing(i / 100));
		expect(Math.max(...samples)).toBeGreaterThan(1.03);
		expect(Math.max(...Array.from({ length: 101 }, (_, i) => springs.snappy.easing(i / 100)))).toBe(
			1
		);
	});

	test('JavaScript tokens match the theme', () => {
		for (const [name, value] of Object.entries(duration)) {
			expect(cssToken(`duration-${name}`)).toBe(`${value}ms`);
		}
		expect(cssToken('stagger')).toBe(`${stagger}ms`);
		expect(cssToken('duration-spring')).toBe(`${springs.smooth.duration}ms`);
		expect(cssToken('duration-spring-snappy')).toBe(`${springs.snappy.duration}ms`);
		expect(cssToken('duration-spring-bouncy')).toBe(`${springs.bouncy.duration}ms`);
		expect(cssToken('ease-out')).toBe('cubic-bezier(0.22, 1, 0.36, 1)');
	});
});

describe('transitions', () => {
	const node = document.createElement('div');

	test('move content with individual transform properties', () => {
		stubReducedMotion(false);
		expect(rise(node).css?.(0.5, 0.5)).toBe('opacity: 0.5; translate: 0 6px');
		expect(blurIn(node).css?.(0, 1)).toContain('filter: blur(8px)');
		const popped = pop(node);
		expect(popped.duration).toBe(springs.smooth.duration);
		expect(popped.css?.(1, 0)).toBe('opacity: 1; scale: 1');
	});

	test('fall back to a short crossfade for reduced motion', () => {
		stubReducedMotion(true);
		for (const transition of [rise, blurIn, pop]) {
			const config = transition(node, { delay: 40 });
			expect(config.delay).toBe(40);
			expect(config.duration).toBe(duration.fast);
			expect(config.css?.(0.5, 0.5)).toBe('opacity: 0.5');
		}
	});
});

describe('reveal', () => {
	function stubObserver() {
		const observers: { callback: IntersectionObserverCallback; disconnect: () => void }[] = [];
		vi.stubGlobal(
			'IntersectionObserver',
			class {
				disconnect = vi.fn();
				observe = vi.fn();
				constructor(callback: IntersectionObserverCallback) {
					observers.push({ callback, disconnect: this.disconnect });
				}
			}
		);
		return observers;
	}

	test('hides children until they intersect, then animates them in sequence', () => {
		stubReducedMotion(false);
		const observers = stubObserver();
		const list = document.createElement('ul');
		list.innerHTML = '<li>One</li><li>Two</li>';
		const items = Array.from(list.children) as HTMLElement[];
		const animate = vi.fn(
			(_keyframes: Keyframe[], _options: KeyframeAnimationOptions) =>
				({ cancel: vi.fn() }) as unknown as Animation
		);
		for (const item of items) item.animate = animate;

		const cleanup = reveal({ children: true, delay: 100 })(list);
		expect(items.map((item) => item.style.opacity)).toEqual(['0', '0']);

		observers[0].callback(
			[{ isIntersecting: true } as IntersectionObserverEntry],
			{} as IntersectionObserver
		);
		expect(items.map((item) => item.style.opacity)).toEqual(['', '']);
		expect(animate.mock.calls.map(([, options]) => options.delay)).toEqual([100, 100 + stagger]);
		expect(observers[0].disconnect).toHaveBeenCalled();

		if (typeof cleanup === 'function') cleanup();
	});

	test('never hides content for reduced motion', () => {
		stubReducedMotion(true);
		stubObserver();
		const node = document.createElement('div');
		reveal()(node);
		expect(node.style.opacity).toBe('');
	});

	test('restores content when detached before it is seen', () => {
		stubReducedMotion(false);
		const observers = stubObserver();
		const node = document.createElement('div');
		const cleanup = reveal()(node);
		expect(node.style.opacity).toBe('0');
		if (typeof cleanup === 'function') cleanup();
		expect(node.style.opacity).toBe('');
		expect(observers[0].disconnect).toHaveBeenCalled();
	});
});

describe('pointerPosition', () => {
	test('exposes the pointer as custom properties and cleans up', () => {
		stubReducedMotion(false);
		vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
			callback(0);
			return 1;
		});
		const node = document.createElement('div');
		node.getBoundingClientRect = () => ({ left: 10, top: 20 }) as DOMRect;
		const cleanup = pointerPosition()(node);

		node.dispatchEvent(new PointerEvent('pointermove', { clientX: 60, clientY: 45 }));
		expect(node.style.getPropertyValue('--pointer-x')).toBe('50px');
		expect(node.style.getPropertyValue('--pointer-y')).toBe('25px');
		expect(node.style.getPropertyValue('--pointer-active')).toBe('1');

		node.dispatchEvent(new PointerEvent('pointerleave'));
		expect(node.style.getPropertyValue('--pointer-active')).toBe('0');

		if (typeof cleanup === 'function') cleanup();
		expect(node.style.getPropertyValue('--pointer-x')).toBe('');
	});

	test('stays inactive for touch and reduced motion', () => {
		for (const [reduce, fine] of [
			[false, false],
			[true, true]
		]) {
			stubReducedMotion(reduce, fine);
			const node = document.createElement('div');
			const cleanup = pointerPosition()(node);
			node.dispatchEvent(new PointerEvent('pointermove', { clientX: 10, clientY: 10 }));
			expect(node.style.getPropertyValue('--pointer-active')).toBe('0');
			expect(node.style.getPropertyValue('--pointer-x')).toBe('');
			if (typeof cleanup === 'function') cleanup();
		}
	});
});

describe('magnetic', () => {
	/** Queues animation frames so the test can step through them. */
	function stubFrames() {
		let queue: FrameRequestCallback[] = [];
		let now = 0;
		vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
			queue.push(callback);
			return queue.length;
		});
		vi.stubGlobal('cancelAnimationFrame', () => {});
		return (frames: number) => {
			for (let i = 0; i < frames; i++) {
				const run = queue;
				queue = [];
				now += 1000 / 60;
				for (const callback of run) callback(now);
			}
		};
	}

	function setup(options?: Parameters<typeof magnetic>[0]) {
		const node = document.createElement('span');
		node.innerHTML = '<span data-magnetic-content>Generate</span>';
		const layer = node.firstElementChild as HTMLElement;
		// A 100 by 40 pill centered at (100, 100), wherever the springs put it.
		node.getBoundingClientRect = () => {
			const x = Number.parseFloat(node.style.translate) || 0;
			const y = Number.parseFloat(node.style.translate.split(' ')[1] ?? '') || 0;
			return { left: 50 + x, top: 80 + y, width: 100, height: 40 } as DOMRect;
		};
		document.body.append(node);
		const cleanup = magnetic(options)(node);
		const point = (clientX: number, clientY: number, pointerType = 'mouse') =>
			window.dispatchEvent(new PointerEvent('pointermove', { clientX, clientY, pointerType }));
		// Cleared at rest, which reads as no offset.
		const offset = () =>
			(node.style.translate || '0px 0px').split(' ').map((value) => Number.parseFloat(value));
		return {
			node,
			layer,
			point,
			offset,
			cleanup: () => typeof cleanup === 'function' && cleanup()
		};
	}

	test('pulls toward a nearby pointer, stretches along the pull, and keeps the label upright', () => {
		stubReducedMotion(false);
		const frames = stubFrames();
		const { node, layer, point, offset, cleanup } = setup();

		// 60px right of center: inside the field, past the pill's edge.
		point(160, 100);
		frames(30);
		const [x, y] = offset();
		expect(x).toBeGreaterThan(4);
		expect(Math.abs(y)).toBeLessThan(0.01);
		const stretch = node.style.transform.match(/scale\(([\d.]+), ([\d.]+)\)/);
		expect(Number(stretch?.[1])).toBeGreaterThan(1);
		expect(Number(stretch?.[2])).toBeLessThan(1);
		// The label travels half again as far and undoes the stretch exactly.
		expect(Number.parseFloat(layer.style.translate)).toBeCloseTo(x / 2, 1);
		const inverse = layer.style.transform.match(/scale\(([\d.]+), ([\d.]+)\)/);
		expect(Number(inverse?.[1]) * Number(stretch?.[1])).toBeCloseTo(1, 5);

		cleanup();
		expect(node.style.translate).toBe('');
		expect(node.style.transform).toBe('');
		expect(layer.style.transform).toBe('');
	});

	test('never travels past the limit and lets go outside the field', () => {
		stubReducedMotion(false);
		const frames = stubFrames();
		const { point, offset, cleanup } = setup({ strength: 1, limit: 6 });

		point(140, 140);
		frames(40);
		expect(Math.hypot(...offset())).toBeLessThanOrEqual(6.01);

		// Past half the pill plus the 96px field, the pull fades to nothing.
		point(400, 100);
		frames(120);
		const [x, y] = offset();
		expect(Math.abs(x)).toBeLessThan(0.05);
		expect(Math.abs(y)).toBeLessThan(0.05);
		cleanup();
	});

	test('hands the element its own translate and transform back once it comes to rest', () => {
		stubReducedMotion(false);
		const frames = stubFrames();
		const { node, layer, point, cleanup } = setup();

		point(160, 100);
		frames(30);
		expect(node.style.translate).not.toBe('');

		point(400, 100);
		frames(400);
		expect(node.style.translate).toBe('');
		expect(node.style.transform).toBe('');
		expect(layer.style.translate).toBe('');
		expect(layer.style.transform).toBe('');
		cleanup();
	});

	test('ignores touch, coarse pointers, and reduced motion', () => {
		stubReducedMotion(false);
		const frames = stubFrames();
		const touch = setup();
		touch.point(160, 100, 'touch');
		frames(10);
		expect(touch.node.style.translate).toBe('');
		touch.cleanup();

		for (const [reduce, fine] of [
			[false, false],
			[true, true]
		]) {
			stubReducedMotion(reduce, fine);
			const { node, point, cleanup } = setup();
			point(160, 100);
			frames(10);
			expect(node.style.translate).toBe('');
			cleanup();
		}
	});
});
