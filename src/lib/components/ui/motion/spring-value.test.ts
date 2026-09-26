import { afterEach, describe, expect, test, vi } from 'vitest';
import { SpringValue, springPresets } from './index.js';

afterEach(() => {
	vi.unstubAllGlobals();
});

function settle(spring: SpringValue, frames = 600) {
	for (let i = 0; i < frames; i++) if (spring.step(1)) return i;
	return frames;
}

describe('SpringValue', () => {
	test('settles exactly on its target', () => {
		const spring = new SpringValue(0, { preset: springPresets.snappy });
		vi.stubGlobal('requestAnimationFrame', () => 1);
		vi.stubGlobal('cancelAnimationFrame', () => {});
		spring.set(100);
		expect(settle(spring)).toBeLessThan(600);
		expect(spring.current).toBe(100);
	});

	test('keeps its velocity when retargeted', () => {
		vi.stubGlobal('requestAnimationFrame', () => 1);
		vi.stubGlobal('cancelAnimationFrame', () => {});
		const spring = new SpringValue(0);
		spring.set(100);
		for (let i = 0; i < 5; i++) spring.step(1);
		expect(spring.velocity).toBeGreaterThan(0);
		const resting = new SpringValue(spring.current);
		spring.set(0);
		resting.set(0);
		spring.step(1);
		resting.step(1);
		// Momentum carries the moving spring further forward than one released from rest.
		expect(spring.current).toBeGreaterThan(resting.current);
	});

	test('jumps under reduced motion and reports the value', () => {
		vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
		const onUpdate = vi.fn();
		const spring = new SpringValue(0, { onUpdate });
		spring.set(40);
		expect(spring.current).toBe(40);
		expect(onUpdate).toHaveBeenCalledWith(40);
		expect(spring.moving).toBe(false);
	});

	test('imports and constructs without browser globals', () => {
		const spring = new SpringValue(5);
		expect(spring.current).toBe(5);
		expect(spring.target).toBe(5);
	});
});
