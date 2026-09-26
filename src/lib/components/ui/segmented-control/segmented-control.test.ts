import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Harness from './segmented-control.test.svelte';

// jsdom has no layout, so give each item a fixed box.
const boxes: Record<string, { left: number; width: number }> = {
	fast: { left: 4, width: 60 },
	balanced: { left: 64, width: 90 },
	thorough: { left: 154, width: 92 }
};
const box = (el: HTMLElement) => boxes[el.dataset.value ?? ''];

let resize: (() => void) | undefined;

beforeEach(() => {
	vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function (
		this: HTMLElement
	) {
		return box(this)?.left ?? 0;
	});
	vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (
		this: HTMLElement
	) {
		return box(this) ? 4 : 0;
	});
	vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (
		this: HTMLElement
	) {
		return box(this)?.width ?? 0;
	});
	vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (
		this: HTMLElement
	) {
		return box(this) ? 32 : 0;
	});
	vi.stubGlobal(
		'ResizeObserver',
		class {
			constructor(callback: () => void) {
				resize = callback;
			}
			observe() {}
			disconnect() {}
		}
	);
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	resize = undefined;
});

const radio = (name: string) => screen.getByRole('radio', { name });

function thumb() {
	const el = screen.getByRole('radiogroup').querySelector<HTMLElement>(':scope > [aria-hidden]');
	if (!el) throw new Error('missing thumb');
	return el;
}

/** The thumb's edges and box, read from the variables on the track. */
function edges() {
	const style = screen.getByRole('radiogroup').style;
	const read = (name: string) => parseFloat(style.getPropertyValue(`--edge-${name}`));
	return { left: read('left'), right: read('right'), top: read('top'), height: read('height') };
}

describe('SegmentedControl', () => {
	test('exposes a named radio group with the checked item marked', () => {
		render(Harness);
		const group = screen.getByRole('radiogroup', { name: 'Response mode' });
		expect(group).toHaveAttribute('data-orientation', 'horizontal');
		expect(screen.getAllByRole('radio')).toHaveLength(3);
		expect(radio('Balanced')).toHaveAttribute('aria-checked', 'true');
		expect(radio('Fast')).toHaveAttribute('aria-checked', 'false');
	});

	test('places the thumb under the checked item and hands off the fallback fill', () => {
		render(Harness);
		expect(thumb()).not.toHaveAttribute('hidden');
		expect(edges()).toEqual({ left: 64, right: 154, top: 4, height: 32 });
		expect(screen.getByRole('radiogroup')).toHaveAttribute('data-indicator');
	});

	test('gives every item its offset so its highlighted label can follow the thumb', () => {
		render(Harness);
		expect(radio('Thorough').style.getPropertyValue('--edge-x')).toBe('154px');
		const copy = radio('Balanced').querySelector('[aria-hidden="true"]');
		expect(copy).toHaveTextContent('Balanced');
		// The copy is decoration: the item keeps a single accessible name.
		expect(radio('Balanced')).toHaveAccessibleName('Balanced');
	});

	test('the highlighted copy is a clone, so ids and children are not repeated', async () => {
		const { rerender } = render(Harness);
		expect(document.querySelectorAll('#fast-label')).toHaveLength(1);
		const copy = radio('Fast').querySelector('[data-slot="segmented-control-highlight"]');
		expect(copy).toHaveTextContent('Fast');
		expect(copy?.querySelector('[id]')).toBeNull();
		expect(copy).toHaveAttribute('inert');

		await rerender({ fastLabel: 'Quick' });
		await vi.waitFor(() => expect(copy).toHaveTextContent('Quick'));
		expect(radio('Quick')).toBeInTheDocument();
	});

	test('selects on click and inches the thumb over, leading edge first', async () => {
		const onValueChange = vi.fn();
		render(Harness, { onValueChange });
		const widths: number[] = [];
		const group = screen.getByRole('radiogroup');
		const observer = new MutationObserver(() => {
			const { left, right } = edges();
			widths.push(right - left);
		});
		observer.observe(group, { attributeFilter: ['style'] });

		await fireEvent.pointerDown(radio('Fast'));
		await fireEvent.click(radio('Fast'));
		expect(radio('Fast')).toHaveAttribute('aria-checked', 'true');
		expect(onValueChange).toHaveBeenCalledWith('fast');

		await vi.waitFor(() => expect(edges()).toMatchObject({ left: 4, right: 64 }));
		observer.disconnect();
		// Moving left, the left edge leaves first, so the thumb stretches past
		// its resting width before the right edge catches up.
		expect(Math.max(...widths)).toBeGreaterThan(90);
	});

	test('follows layout changes instantly', async () => {
		render(Harness);
		boxes.balanced.width = 120;
		resize?.();
		await tick();
		boxes.balanced.width = 90;
		expect(edges()).toMatchObject({ left: 64, right: 184 });
	});

	test('moves the selection with arrow keys, looping and skipping disabled items', async () => {
		render(Harness, { thoroughDisabled: true });
		radio('Balanced').focus();

		await fireEvent.keyDown(radio('Balanced'), { key: 'ArrowRight' });
		expect(radio('Fast')).toHaveAttribute('aria-checked', 'true');
		expect(radio('Fast')).toHaveFocus();

		await fireEvent.keyDown(radio('Fast'), { key: 'ArrowLeft' });
		expect(radio('Balanced')).toHaveAttribute('aria-checked', 'true');
		expect(radio('Thorough')).toBeDisabled();
	});

	test('supports Home and End', async () => {
		render(Harness);
		radio('Balanced').focus();
		await fireEvent.keyDown(radio('Balanced'), { key: 'End' });
		expect(radio('Thorough')).toHaveAttribute('aria-checked', 'true');
		await fireEvent.keyDown(radio('Thorough'), { key: 'Home' });
		expect(radio('Fast')).toHaveAttribute('aria-checked', 'true');
	});

	test('disables every item from the root', () => {
		render(Harness, { disabled: true });
		expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-disabled', 'true');
		for (const item of screen.getAllByRole('radio')) expect(item).toBeDisabled();
	});

	test('hides the thumb when nothing is selected', () => {
		render(Harness, { value: '' });
		expect(thumb()).toHaveAttribute('hidden');
		expect(screen.getByRole('radiogroup')).not.toHaveAttribute('data-indicator');
	});

	test('stops observing when destroyed', () => {
		const { unmount } = render(Harness);
		const group = screen.getByRole('radiogroup');
		unmount();
		expect(group).not.toHaveAttribute('data-indicator');
	});
});
