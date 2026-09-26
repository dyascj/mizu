import { act, render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import NumberTicker from './number-ticker.svelte';
import Fixture from './number-ticker.test.svelte';

function stubReducedMotion(reduce: boolean) {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: reduce && query.includes('reduce'),
		media: query,
		addEventListener() {},
		removeEventListener() {}
	}));
}

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

const visual = (container: HTMLElement) =>
	container.querySelector('[aria-hidden="true"]') as HTMLElement;
const columns = (container: HTMLElement) => Array.from(visual(container).children) as HTMLElement[];
const rollers = (container: HTMLElement) =>
	Array.from(container.querySelectorAll<HTMLElement>('.ticker-column > .absolute'));

beforeEach(() => {
	Element.prototype.animate = fakeAnimate;
	stubReducedMotion(false);
});

afterEach(() => {
	Element.prototype.animate = nativeAnimate;
	vi.unstubAllGlobals();
});

describe('NumberTicker', () => {
	test('exposes the formatted value once and hides the rolling columns', () => {
		const { container } = render(NumberTicker, { value: 1234.5, locale: 'en-US' });
		expect(container.querySelector('.sr-only')).toHaveTextContent('1,234.5');
		expect(visual(container)).toBeInTheDocument();
		expect(container.firstElementChild).toHaveClass('tabular-nums');
	});

	test('rolls each digit column to its value and keeps separators static', () => {
		const { container } = render(NumberTicker, {
			value: 1234.5,
			locale: 'en-US',
			format: { style: 'currency', currency: 'USD' }
		});
		expect(columns(container).map((column) => column.textContent?.trim().charAt(0))).toEqual([
			'$',
			'1',
			',',
			'2',
			'3',
			'4',
			'.',
			'5',
			'0'
		]);
		expect(rollers(container).map((roller) => roller.style.translate)).toEqual([
			'0 -10%',
			'0 -20%',
			'0 -30%',
			'0 -40%',
			'0 -50%',
			'0 0%'
		]);
		expect(container.querySelectorAll('.ticker-column')).toHaveLength(6);
	});

	test('rolls the digits of any numbering system', () => {
		const { container } = render(NumberTicker, { value: 42, locale: 'ar-EG' });
		const [tens, ones] = rollers(container);
		expect(container.querySelector('.sr-only')).toHaveTextContent('٤٢');
		expect(tens.textContent).toBe('٠١٢٣٤٥٦٧٨٩');
		expect(tens.style.translate).toBe('0 -40%');
		expect(ones.style.translate).toBe('0 -20%');
	});

	test('keeps columns by place value so a new leading digit enters on the left', async () => {
		const animate = vi.fn(fakeAnimate);
		Element.prototype.animate = animate;
		const { container, rerender } = render(NumberTicker, { value: 999, locale: 'en-US' });
		const ones = columns(container).at(-1);

		await rerender({ value: 1000 });
		expect(container.querySelector('.sr-only')).toHaveTextContent('1,000');
		expect(columns(container).at(-1)).toBe(ones);
		expect(rollers(container).at(-1)?.style.translate).toBe('0 0%');
		expect(animate).toHaveBeenCalled();
	});

	test('swaps columns without transitions for reduced motion', async () => {
		stubReducedMotion(true);
		const animate = vi.fn(fakeAnimate);
		Element.prototype.animate = animate;
		const { container, rerender } = render(NumberTicker, { value: 1000, locale: 'en-US' });

		await rerender({ value: 999 });
		expect(columns(container)).toHaveLength(3);
		expect(animate).not.toHaveBeenCalled();
	});

	describe('wheels', () => {
		// Hold every wheel where the change found it, before the spring moves.
		beforeEach(() => vi.stubGlobal('requestAnimationFrame', () => 1));

		const cell = (roller: HTMLElement | undefined, digit: number) =>
			(roller?.children[digit] as HTMLElement).style.translate;

		test('a rising value rolls forward: the new digit comes up from below', async () => {
			const { container, rerender } = render(NumberTicker, { value: 9, locale: 'en-US' });
			await rerender({ value: 10 });
			const [tens, ones] = rollers(container);
			expect(cell(ones, 0)).toBe('0 100%');
			// The new tens column rolls up from zero rather than appearing.
			expect(cell(tens, 1)).toBe('0 100%');
		});

		test('a falling value rolls backward: the new digit comes down from above', async () => {
			const { container, rerender } = render(NumberTicker, { value: 20, locale: 'en-US' });
			await rerender({ value: 19 });
			const [tens, ones] = rollers(container);
			expect(cell(ones, 9)).toBe('0 -100%');
			expect(cell(tens, 1)).toBe('0 -100%');
		});

		test('keeps rolling the way the value moved, even the long way round', async () => {
			const { container, rerender } = render(NumberTicker, { value: 1, locale: 'en-US' });
			await rerender({ value: 9 });
			// Eight steps forward: 9 starts two places above and travels up through the wrap.
			expect(cell(rollers(container)[0], 9)).toBe('0 -200%');
		});

		test('a new format takes the short way round, whichever way the value last moved', async () => {
			let frames: FrameRequestCallback[] = [];
			vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
				frames.push(callback);
				return frames.length;
			});
			let clock = performance.now();
			const flush = () => {
				clock += 16;
				const run = frames;
				frames = [];
				for (const callback of run) callback(clock);
			};

			const { container, component } = render(Fixture);
			await act(() => component.setFormat({ maximumFractionDigits: 0 }));
			await act(() => component.setValue(12.6));
			expect(container.querySelector('.sr-only')).toHaveTextContent('13');
			for (let i = 0; i < 500 && frames.length; i++) flush();
			expect(frames).toHaveLength(0);

			// Truncating shows 12: the ones place turns from 3 back to 2, one step,
			// not nine forward just because the value last rose.
			await act(() => component.setFormat({ maximumFractionDigits: 0, roundingMode: 'trunc' }));
			expect(container.querySelector('.sr-only')).toHaveTextContent('12');
			flush();
			const lift = parseFloat(cell(rollers(container).at(-1), 2).split(' ')[1]);
			expect(lift).toBeLessThan(0);
			expect(lift).toBeGreaterThan(-100);
		});

		test('an odometer pads to its wheels and wraps forward past the top', async () => {
			const { container, rerender } = render(NumberTicker, {
				value: 999,
				locale: 'en-US',
				odometer: 3
			});
			expect(container.querySelector('.sr-only')).toHaveTextContent('999');
			await rerender({ value: 1000 });
			expect(container.querySelector('.sr-only')).toHaveTextContent('000');
			expect(rollers(container)).toHaveLength(3);
			for (const roller of rollers(container)) {
				expect(roller.style.translate).toBe('0 0%');
				expect(cell(roller, 0)).toBe('0 100%');
			}
		});

		test('an odometer shows leading zeros and wraps negative values', () => {
			const { container } = render(NumberTicker, { value: -1, locale: 'en-US', odometer: 4 });
			expect(container.querySelector('.sr-only')).toHaveTextContent('9999');
			const { container: padded } = render(NumberTicker, {
				value: 42,
				locale: 'en-US',
				odometer: 4
			});
			expect(padded.querySelector('.sr-only')).toHaveTextContent('0042');
		});

		test('reduced motion lands on the new digit without rolling', async () => {
			stubReducedMotion(true);
			const { container, rerender } = render(NumberTicker, { value: 9, locale: 'en-US' });
			await rerender({ value: 10 });
			for (const roller of rollers(container)) {
				expect(Array.from(roller.children).every((c) => !(c as HTMLElement).style.translate)).toBe(
					true
				);
			}
		});
	});
});
