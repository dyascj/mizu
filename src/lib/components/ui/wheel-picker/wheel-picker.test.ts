import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Harness from './wheel-picker.test.svelte';
import { WheelPickerColumn } from './index.js';

// jsdom has no layout, so give every element a scroll position that fires a
// scroll event when set, and ask for reduced motion so glides land at once.
const nativeMatchMedia = window.matchMedia;
const scrollTops = new WeakMap<Element, number>();
/** Tests that watch a glide in flight turn this off. */
let reduced = true;

beforeEach(() => {
	reduced = true;
	window.matchMedia = ((query: string) => ({
		matches: reduced && query.includes('reduce'),
		media: query,
		addEventListener() {},
		removeEventListener() {}
	})) as unknown as typeof window.matchMedia;
	Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
		configurable: true,
		get() {
			return scrollTops.get(this) ?? 0;
		},
		set(value: number) {
			scrollTops.set(this, value);
			this.dispatchEvent(new Event('scroll'));
		}
	});
});

afterEach(() => {
	window.matchMedia = nativeMatchMedia;
	// @ts-expect-error restores the prototype's own accessor
	delete HTMLElement.prototype.scrollTop;
});

describe('WheelPicker', () => {
	test('is a named group of spinbuttons that say their value', () => {
		render(Harness);
		expect(screen.getByRole('group', { name: 'Briefing time' })).toBeInTheDocument();
		const hour = screen.getByRole('spinbutton', { name: 'Hour' });
		expect(hour).toHaveAttribute('aria-valuetext', '7');
		expect(hour).toHaveAttribute('aria-valuenow', '6');
		expect(hour).toHaveAttribute('aria-valuemax', '11');
		expect(screen.getByRole('spinbutton', { name: 'AM or PM' })).toHaveAttribute(
			'aria-valuetext',
			'AM'
		);
	});

	test('starts scrolled to its value', () => {
		render(Harness);
		expect(screen.getByRole('spinbutton', { name: 'Hour' }).scrollTop).toBe(6 * 40);
	});

	test('arrow, page, Home, and End keys spin the drum', async () => {
		const onValueChange = vi.fn();
		render(Harness, { onValueChange });
		const hour = screen.getByRole('spinbutton', { name: 'Hour' });

		await fireEvent.keyDown(hour, { key: 'ArrowDown' });
		await vi.waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith('8'));
		expect(hour).toHaveAttribute('aria-valuetext', '8');

		await fireEvent.keyDown(hour, { key: 'PageUp' });
		await vi.waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith('3'));

		await fireEvent.keyDown(hour, { key: 'End' });
		await vi.waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith('12'));

		await fireEvent.keyDown(hour, { key: 'Home' });
		await vi.waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith('1'));
	});

	test('clicking a row spins it under the band', async () => {
		const onValueChange = vi.fn();
		render(Harness, { onValueChange });
		const hour = screen.getByRole('spinbutton', { name: 'Hour' });
		await fireEvent.click(hour.querySelector('[data-index="9"]')!);
		await vi.waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith('10'));
	});

	test('follows a value set from outside', async () => {
		const { rerender } = render(Harness);
		await rerender({ hour: '11' });
		const hour = screen.getByRole('spinbutton', { name: 'Hour' });
		await vi.waitFor(() => expect(hour.scrollTop).toBe(10 * 40));
		expect(hour).toHaveAttribute('aria-valuetext', '11');
	});

	test('disabled columns leave the tab order and ignore keys', async () => {
		const onValueChange = vi.fn();
		render(Harness, { disabled: true, onValueChange });
		const hour = screen.getByRole('spinbutton', { name: 'Hour' });
		expect(hour).toHaveAttribute('tabindex', '-1');
		expect(hour).toHaveAttribute('aria-disabled', 'true');
		await fireEvent.keyDown(hour, { key: 'ArrowDown' });
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('follows a value set from outside after a scroll', async () => {
		const { rerender } = render(Harness);
		const hour = screen.getByRole('spinbutton', { name: 'Hour' });
		// A wheel or trackpad scroll, which never goes through a glide.
		hour.scrollTop = 2 * 40;
		await vi.waitFor(() => expect(hour).toHaveAttribute('aria-valuetext', '3'));

		await rerender({ hour: '7' });
		await vi.waitFor(() => expect(hour.scrollTop).toBe(6 * 40));
		expect(hour).toHaveAttribute('aria-valuetext', '7');
	});

	test('a press released outside does not leave hovering dragging the drum', async () => {
		render(Harness);
		const hour = screen.getByRole('spinbutton', { name: 'Hour' });
		pointer(hour, 'pointerdown', { clientY: 200, buttons: 1 }, 0);
		// Slides sideways out of the column and lets go there.
		pointer(hour, 'pointermove', { clientY: 201, buttons: 1 }, 10);
		// Later, plain hovering with no button held.
		pointer(hour, 'pointermove', { clientY: 260, buttons: 0 }, 500);
		pointer(hour, 'pointermove', { clientY: 300, buttons: 0 }, 510);
		expect(hour.scrollTop).toBe(6 * 40);
	});

	test('a fast drag flings, but not once the hand has stopped', async () => {
		const drag = (release: number) => {
			const hour = screen.getByRole('spinbutton', { name: 'Hour' });
			pointer(hour, 'pointerdown', { clientY: 200, buttons: 1 }, 0);
			pointer(hour, 'pointermove', { clientY: 160, buttons: 1 }, 10);
			pointer(hour, 'pointermove', { clientY: 120, buttons: 1 }, 20);
			pointer(hour, 'pointerup', { clientY: 120, buttons: 0 }, release);
			return hour;
		};

		const flung = render(Harness);
		const fast = drag(25);
		await vi.waitFor(() => expect(fast).toHaveAttribute('aria-valuetext', '12'));
		flung.unmount();

		render(Harness);
		const held = drag(1020);
		await vi.waitFor(() => expect(held.scrollTop).toBe(8 * 40));
		expect(held).toHaveAttribute('aria-valuetext', '9');
	});

	test('screen readers hear where a glide lands, not each row it passes', async () => {
		reduced = false;
		const onValueChange = vi.fn();
		render(Harness, { onValueChange });
		const hour = screen.getByRole('spinbutton', { name: 'Hour' });
		const heard: (string | null)[] = [];
		const observer = new MutationObserver(() => heard.push(hour.getAttribute('aria-valuetext')));
		observer.observe(hour, { attributes: true, attributeFilter: ['aria-valuetext'] });

		await fireEvent.keyDown(hour, { key: 'End' });
		await vi.waitFor(() => expect(hour).toHaveAttribute('aria-valuetext', '12'));
		expect(hour).toHaveAttribute('aria-valuenow', '11');
		await vi.waitFor(() => expect(hour.scrollTop).toBe(11 * 40), { timeout: 3000 });
		await vi.waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith('12'));
		observer.disconnect();

		// The value still moves through the rows on the way.
		expect(onValueChange.mock.calls.some(([value]) => value !== '12')).toBe(true);
		expect(heard.filter((text, i) => text !== heard[i - 1])).toEqual(['12']);
	});

	test('fewer options mid-glide snap again and clamp the value', async () => {
		reduced = false;
		const onDayChange = vi.fn();
		const { rerender } = render(Harness, { days: 31, day: '20', onDayChange });
		const day = screen.getByRole('spinbutton', { name: 'Day' });
		await fireEvent.keyDown(day, { key: 'End' });
		// Past the 28th but not yet landed on the 31st.
		await vi.waitFor(() => expect(onDayChange).toHaveBeenCalledWith('29'), {
			timeout: 3000,
			interval: 1
		});
		expect(day.style.scrollSnapType).toBe('none');

		await rerender({ days: 28 });
		expect(day.style.scrollSnapType).toBe('');
		await vi.waitFor(() => expect(day).toHaveAttribute('aria-valuetext', '28'));
		expect(day).toHaveAttribute('aria-valuemax', '27');
		expect(onDayChange).toHaveBeenLastCalledWith('28');
	});

	test('fewer options with a new value spin to that value', async () => {
		const days = (n: number) => Array.from({ length: n }, (_, i) => String(i + 1));
		// A parent that clamps the day itself as the month shortens.
		const { rerender } = render(WheelPickerColumn, {
			label: 'Day',
			options: days(31),
			value: '31'
		});
		const day = screen.getByRole('spinbutton', { name: 'Day' });
		await rerender({ options: days(28), value: '15' });
		await vi.waitFor(() => expect(day.scrollTop).toBe(14 * 40));
		expect(day).toHaveAttribute('aria-valuetext', '15');
	});
});

/** A mouse pointer event at a chosen time, since jsdom stamps events itself. */
function pointer(el: Element, type: string, init: PointerEventInit, timeStamp: number) {
	const event = new PointerEvent(type, {
		bubbles: true,
		cancelable: true,
		pointerId: 1,
		pointerType: 'mouse',
		button: 0,
		...init
	});
	Object.defineProperty(event, 'timeStamp', { value: timeStamp });
	el.dispatchEvent(event);
}
