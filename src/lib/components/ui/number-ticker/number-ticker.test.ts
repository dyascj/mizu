import { render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import NumberTicker from './number-ticker.svelte';

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
});
