import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import NumberInput from './number-input.svelte';

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
	Element.prototype.animate = fakeAnimate;
	vi.useFakeTimers();
	// Keep NumberTicker's wheels still; the tests read values, not frames.
	vi.stubGlobal('requestAnimationFrame', () => 1);
});

afterEach(() => {
	Element.prototype.animate = nativeAnimate;
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

function setup(props: Record<string, unknown> = {}) {
	const onValueChange = vi.fn();
	const result = render(NumberInput, { label: 'Seats', onValueChange, ...props });
	const input = screen.getByRole('spinbutton', { name: 'Seats' });
	const increase = screen.getByRole('button', { name: 'Increase seats' });
	const decrease = screen.getByRole('button', { name: 'Decrease seats' });
	return { ...result, onValueChange, input, increase, decrease };
}

describe('NumberInput', () => {
	test('is a named spinbutton with its range, and the buttons stay out of the tab order', () => {
		const { input, increase, decrease } = setup({
			value: 4,
			min: 1,
			max: 50,
			locale: 'en-US',
			format: { style: 'unit', unit: 'day', unitDisplay: 'long' }
		});
		expect(input).toHaveAttribute('aria-valuenow', '4');
		expect(input).toHaveAttribute('aria-valuemin', '1');
		expect(input).toHaveAttribute('aria-valuemax', '50');
		expect(input).toHaveAttribute('aria-valuetext', '4 days');
		expect(input).toHaveAttribute('inputmode', 'numeric');
		for (const button of [increase, decrease]) {
			expect(button).toHaveAttribute('tabindex', '-1');
			expect(button).toHaveAttribute('aria-controls', input.id);
		}
	});

	test('leaves an unbounded maximum out of the semantics', () => {
		const { input } = setup();
		expect(input).toHaveAttribute('aria-valuenow', '0');
		expect(input).not.toHaveAttribute('aria-valuemax');
	});

	test('steps with the arrow, page, home, and end keys, and clamps to the range', async () => {
		const { input, onValueChange } = setup({ value: 5, min: 0, max: 30 });
		await fireEvent.keyDown(input, { key: 'ArrowUp' });
		expect(input).toHaveAttribute('aria-valuenow', '6');
		await fireEvent.keyDown(input, { key: 'ArrowDown' });
		await fireEvent.keyDown(input, { key: 'ArrowDown' });
		expect(input).toHaveAttribute('aria-valuenow', '4');
		await fireEvent.keyDown(input, { key: 'PageUp' });
		expect(input).toHaveAttribute('aria-valuenow', '14');
		await fireEvent.keyDown(input, { key: 'End' });
		expect(input).toHaveAttribute('aria-valuenow', '30');
		await fireEvent.keyDown(input, { key: 'ArrowUp' });
		expect(input).toHaveAttribute('aria-valuenow', '30');
		await fireEvent.keyDown(input, { key: 'Home' });
		expect(input).toHaveAttribute('aria-valuenow', '0');
		expect(onValueChange.mock.calls.map(([value]) => value)).toEqual([6, 5, 4, 14, 30, 0]);
	});

	test('holding a button steps once, waits, then repeats faster and faster', async () => {
		const { input, increase } = setup({ value: 0, max: 1000 });
		await fireEvent.pointerDown(increase, { button: 0 });
		expect(input).toHaveAttribute('aria-valuenow', '1');

		// The pause before repeating keeps a click to a single step.
		await advance(399);
		expect(input).toHaveAttribute('aria-valuenow', '1');
		await advance(1);
		expect(input).toHaveAttribute('aria-valuenow', '2');

		// The first second of repeats covers less ground than the next.
		await advance(1000);
		const firstSecond = Number(input.getAttribute('aria-valuenow')) - 2;
		await advance(1000);
		const secondSecond = Number(input.getAttribute('aria-valuenow')) - 2 - firstSecond;
		expect(secondSecond).toBeGreaterThan(firstSecond);

		await fireEvent.pointerUp(increase);
		const released = input.getAttribute('aria-valuenow');
		await advance(1000);
		expect(input).toHaveAttribute('aria-valuenow', released);
	});

	test('a hold stops at the limit and the button reports it', async () => {
		const { input, increase, decrease } = setup({ value: 1, min: 1, max: 3 });
		expect(decrease).toHaveAttribute('aria-disabled', 'true');
		await fireEvent.pointerDown(increase, { button: 0 });
		await advance(2000);
		expect(input).toHaveAttribute('aria-valuenow', '3');
		expect(increase).toHaveAttribute('aria-disabled', 'true');
		expect(decrease).not.toHaveAttribute('aria-disabled');
		await fireEvent.pointerUp(increase);
	});

	test('keyboard and assistive technology clicks step once', async () => {
		const { input, increase } = setup({ value: 2 });
		await fireEvent.click(increase, { detail: 0 });
		expect(input).toHaveAttribute('aria-valuenow', '3');
		// A pointer click already stepped on pointer down.
		await fireEvent.click(increase, { detail: 1 });
		expect(input).toHaveAttribute('aria-valuenow', '3');
	});

	test('typing replaces the number on Enter or blur, clamps it, and Escape discards it', async () => {
		const { input, onValueChange } = setup({ value: 2, max: 20 });
		await fireEvent.input(input, { target: { value: '12' } });
		await fireEvent.keyDown(input, { key: 'Enter' });
		expect(input).toHaveAttribute('aria-valuenow', '12');
		expect(input).toHaveValue('12');

		await fireEvent.input(input, { target: { value: '8x' } });
		expect(input).toHaveValue('8');
		await fireEvent.keyDown(input, { key: 'Escape' });
		expect(input).toHaveValue('12');

		await fireEvent.input(input, { target: { value: '99' } });
		await fireEvent.blur(input);
		expect(input).toHaveAttribute('aria-valuenow', '20');
		expect(onValueChange.mock.calls.map(([value]) => value)).toEqual([12, 20]);
	});

	test('keeps fractional steps exact', async () => {
		const { input } = setup({ value: 0.2, step: 0.1, max: 1 });
		expect(input).toHaveAttribute('inputmode', 'decimal');
		await fireEvent.keyDown(input, { key: 'ArrowUp' });
		expect(input).toHaveAttribute('aria-valuenow', '0.3');
	});

	test('only a real limit nudges, never float noise or rounding', async () => {
		const animate = vi.fn<Element['animate']>(fakeAnimate);
		Element.prototype.animate = animate;
		const nudges = () =>
			animate.mock.calls.filter(
				([frames]) => !Array.isArray(frames) && 'translate' in (frames as PropertyIndexedKeyframes)
			);
		const { input } = setup({ value: 0.2, step: 0.1, max: 0.4 });
		await fireEvent.keyDown(input, { key: 'ArrowUp' });
		await fireEvent.keyDown(input, { key: 'ArrowUp' });
		expect(input).toHaveAttribute('aria-valuenow', '0.4');
		expect(nudges()).toHaveLength(0);
		await fireEvent.keyDown(input, { key: 'ArrowUp' });
		expect(nudges()).toHaveLength(1);

		// A typed value rounded to the step lands without a nudge.
		await fireEvent.input(input, { target: { value: '0.33' } });
		await fireEvent.keyDown(input, { key: 'Enter' });
		expect(input).toHaveAttribute('aria-valuenow', '0.3');
		expect(nudges()).toHaveLength(1);
	});

	test('reads the locale decimal mark when typing', async () => {
		const { input, onValueChange } = setup({ value: 1, step: 0.1, max: 10, locale: 'de-DE' });
		await fireEvent.input(input, { target: { value: '3,5' } });
		expect(input).toHaveValue('3,5');
		await fireEvent.keyDown(input, { key: 'Enter' });
		expect(input).toHaveAttribute('aria-valuenow', '3.5');
		expect(onValueChange).toHaveBeenLastCalledWith(3.5);
	});

	test('a stray character never stays in the field', async () => {
		const { input } = setup({ value: 2 });
		await fireEvent.input(input, { target: { value: '8' } });
		await fireEvent.input(input, { target: { value: '8x' } });
		expect(input).toHaveValue('8');
	});

	test('keeps an acronym intact in the button names', () => {
		render(NumberInput, { label: 'API keys', value: 1 });
		expect(screen.getByRole('button', { name: 'Increase API keys' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Decrease API keys' })).toBeInTheDocument();
	});

	test('disabled blocks every path', async () => {
		const { input, increase, onValueChange } = setup({ value: 2, disabled: true });
		expect(input).toBeDisabled();
		expect(increase).toBeDisabled();
		await fireEvent.keyDown(input, { key: 'ArrowUp' });
		await fireEvent.pointerDown(increase, { button: 0 });
		await advance(1000);
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('names itself from a visible label through its id', () => {
		render(NumberInput, { id: 'retries', value: 1 });
		expect(screen.getByRole('spinbutton')).toHaveAttribute('id', 'retries');
		expect(screen.getByRole('button', { name: 'Increase' })).toHaveAttribute(
			'aria-controls',
			'retries'
		);
	});
});
