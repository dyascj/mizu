import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Switch from './switch.svelte';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

function setup(props: Record<string, unknown> = {}) {
	const onCheckedChange = vi.fn();
	const result = render(Switch, { 'aria-label': 'Web search', onCheckedChange, ...props });
	const control = screen.getByRole('switch', { name: 'Web search' });
	const thumb = control.querySelector<HTMLElement>('[data-switch-thumb]')!;
	const fill = control.querySelector<HTMLElement>('[data-slot="switch-fill"]')!;
	return { ...result, control, thumb, fill, onCheckedChange };
}

const offset = (thumb: HTMLElement) => parseFloat(thumb.style.translate) || 0;
const width = (thumb: HTMLElement) => parseFloat(thumb.style.width);

describe('Switch', () => {
	test('is a switch that reports its state and renders it before hydration', () => {
		const { control, thumb, fill } = setup({ checked: true });
		expect(control).toHaveAttribute('aria-checked', 'true');
		expect(offset(thumb)).toBe(20);
		expect(fill.style.opacity).toBe('1');
	});

	test('toggles on click and travels the knob across', async () => {
		const { control, thumb, fill, onCheckedChange } = setup();
		await fireEvent.click(control);
		expect(control).toHaveAttribute('aria-checked', 'true');
		expect(onCheckedChange).toHaveBeenCalledWith(true);
		await advance(1000);
		expect(offset(thumb)).toBe(20);
		expect(width(thumb)).toBe(20);
		expect(fill.style.opacity).toBe('1');
	});

	test('toggles from the keyboard without leaning', async () => {
		const { control, thumb } = setup();
		await fireEvent.keyDown(control, { key: ' ' });
		expect(control).toHaveAttribute('aria-checked', 'true');
		await advance(32);
		expect(width(thumb)).toBe(20);
		await fireEvent.keyDown(control, { key: 'Enter' });
		expect(control).toHaveAttribute('aria-checked', 'false');
	});

	test('leans into the move while pressed and lets go on release', async () => {
		const { control, thumb } = setup();
		await fireEvent.pointerDown(control, { button: 0, pointerId: 1, clientX: 10 });
		await advance(300);
		expect(width(thumb)).toBeGreaterThan(24);
		// Off, the knob grows rightward from the left wall.
		expect(offset(thumb)).toBe(0);

		await fireEvent.pointerUp(control, { pointerId: 1, clientX: 10 });
		await fireEvent.click(control, { detail: 1 });
		await advance(1000);
		expect(control).toHaveAttribute('aria-checked', 'true');
		expect(width(thumb)).toBe(20);
		expect(offset(thumb)).toBe(20);
	});

	test('drags the knob and commits on release without a second toggle', async () => {
		const { control, thumb, fill, onCheckedChange } = setup();
		await fireEvent.pointerDown(control, { button: 0, pointerId: 1, clientX: 10 });
		await fireEvent.pointerMove(control, { pointerId: 1, clientX: 18 });
		expect(offset(thumb)).toBeGreaterThan(0);
		expect(Number(fill.style.opacity)).toBeGreaterThan(0.3);
		expect(control).toHaveAttribute('aria-checked', 'false');

		await fireEvent.pointerMove(control, { pointerId: 1, clientX: 40 });
		await fireEvent.pointerUp(control, { pointerId: 1, clientX: 40 });
		// The click that ends the drag is swallowed.
		await fireEvent.click(control, { detail: 1 });
		expect(control).toHaveAttribute('aria-checked', 'true');
		expect(onCheckedChange).toHaveBeenCalledTimes(1);
		expect(onCheckedChange).toHaveBeenCalledWith(true);
		await advance(1000);
		expect(offset(thumb)).toBe(20);
	});

	test('a drag that ends short of halfway springs back', async () => {
		const { control, thumb, onCheckedChange } = setup();
		await fireEvent.pointerDown(control, { button: 0, pointerId: 1, clientX: 10 });
		await fireEvent.pointerMove(control, { pointerId: 1, clientX: 15 });
		await fireEvent.pointerUp(control, { pointerId: 1, clientX: 15 });
		await fireEvent.click(control, { detail: 1 });
		expect(control).toHaveAttribute('aria-checked', 'false');
		expect(onCheckedChange).not.toHaveBeenCalled();
		await advance(1000);
		expect(offset(thumb)).toBe(0);
	});

	test('movement inside the slop is still a tap', async () => {
		const { control } = setup();
		await fireEvent.pointerDown(control, { button: 0, pointerId: 1, clientX: 10 });
		await fireEvent.pointerMove(control, { pointerId: 1, clientX: 12 });
		await fireEvent.pointerUp(control, { pointerId: 1, clientX: 12 });
		await fireEvent.click(control, { detail: 1 });
		expect(control).toHaveAttribute('aria-checked', 'true');
	});

	test('a cancelled drag returns to where it was', async () => {
		const { control, thumb } = setup();
		await fireEvent.pointerDown(control, { button: 0, pointerId: 1, clientX: 10 });
		await fireEvent.pointerMove(control, { pointerId: 1, clientX: 40 });
		await fireEvent.pointerCancel(control, { pointerId: 1 });
		await advance(1000);
		expect(control).toHaveAttribute('aria-checked', 'false');
		expect(offset(thumb)).toBe(0);
	});

	test('follows changes made by the parent', async () => {
		const { control, thumb, rerender } = setup();
		await rerender({ checked: true });
		expect(control).toHaveAttribute('aria-checked', 'true');
		await advance(1000);
		expect(offset(thumb)).toBe(20);
	});

	test('jumps without the lean under reduced motion', async () => {
		vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
		const { control, thumb } = setup();
		await fireEvent.pointerDown(control, { button: 0, pointerId: 1, clientX: 10 });
		await advance(300);
		expect(width(thumb)).toBe(20);
		await fireEvent.pointerUp(control, { pointerId: 1, clientX: 10 });
		await fireEvent.click(control, { detail: 1 });
		expect(offset(thumb)).toBe(20);
	});

	test('a drag that ends without a click does not swallow the next one', async () => {
		const { control, onCheckedChange } = setup();
		await fireEvent.pointerDown(control, { button: 0, pointerId: 1, clientX: 10 });
		await fireEvent.pointerMove(control, { pointerId: 1, clientX: 40 });
		await fireEvent.pointerUp(control, { pointerId: 1, clientX: 40 });
		// A touch drag often ends with no click at all.
		expect(control).toHaveAttribute('aria-checked', 'true');
		await advance(1000);
		// A later click from a label or assistive technology still toggles.
		await fireEvent.click(control, { detail: 0 });
		expect(control).toHaveAttribute('aria-checked', 'false');
		expect(onCheckedChange).toHaveBeenLastCalledWith(false);
	});

	test("at rest the track's own state color shows, so a consumer's override wins", async () => {
		// jsdom has no stylesheet; stand in for the two state colors.
		const real = window.getComputedStyle;
		const colors: Record<string, string> = {
			checked: 'rgb(5, 150, 105)',
			unchecked: 'rgb(229, 229, 229)'
		};
		vi.spyOn(window, 'getComputedStyle').mockImplementation((el, pseudo) => {
			const probe = el instanceof HTMLElement && el.style.visibility === 'hidden';
			const color = probe ? colors[el.dataset.state ?? ''] : undefined;
			return color ? ({ backgroundColor: color } as CSSStyleDeclaration) : real(el, pseudo);
		});
		const { control, fill, thumb } = setup({ class: 'data-[state=checked]:bg-emerald-600' });
		expect(fill).toHaveClass('bg-inherit');
		expect(control).toHaveClass('data-[state=checked]:bg-emerald-600');
		await fireEvent.click(control);
		// Mid-travel the track holds the off color and the fill brings the consumer's on color.
		await advance(48);
		expect(control.style.backgroundColor).toBe('rgb(229, 229, 229)');
		expect(fill.style.backgroundColor).toBe('rgb(5, 150, 105)');
		// The knob holds one color in flight, so it never fades into the track.
		expect(thumb.style.backgroundColor).toBe('rgb(5, 150, 105)');
		await advance(1000);
		// Motion lends the track, fill, and knob their colors only while it runs.
		expect(control.style.backgroundColor).toBe('');
		expect(fill.style.backgroundColor).toBe('');
		expect(thumb.style.backgroundColor).toBe('');
		expect(control).toHaveAttribute('data-state', 'checked');
	});

	test('ignores presses while disabled', async () => {
		const { control, onCheckedChange } = setup({ disabled: true });
		expect(control).toBeDisabled();
		await fireEvent.pointerDown(control, { button: 0, pointerId: 1, clientX: 10 });
		await fireEvent.pointerMove(control, { pointerId: 1, clientX: 40 });
		await fireEvent.pointerUp(control, { pointerId: 1, clientX: 40 });
		expect(onCheckedChange).not.toHaveBeenCalled();
	});

	test('stops its frame loop when destroyed', async () => {
		const { control, unmount } = setup();
		await fireEvent.click(control);
		unmount();
		expect(vi.getTimerCount()).toBe(0);
	});
});
