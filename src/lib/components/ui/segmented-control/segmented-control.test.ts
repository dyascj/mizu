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

/** Every inline style the thumb passes through from now on. */
function recordStyles(el: HTMLElement) {
	const seen: string[] = [];
	const observer = new MutationObserver((records) => {
		for (const record of records) if (record.oldValue) seen.push(record.oldValue);
	});
	observer.observe(el, { attributeFilter: ['style'], attributeOldValue: true });
	return async () => {
		await tick();
		observer.takeRecords().forEach((record) => record.oldValue && seen.push(record.oldValue));
		observer.disconnect();
		return [...seen, el.getAttribute('style') ?? ''];
	};
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
		expect(thumb().style.translate).toBe('64px 4px');
		expect(thumb().style.width).toBe('90px');
		expect(thumb().style.height).toBe('32px');
		expect(thumb().style.transition).toBe('');
		expect(screen.getByRole('radiogroup')).toHaveAttribute('data-indicator');
	});

	test('selects on click and slides the thumb with its transition', async () => {
		const onValueChange = vi.fn();
		render(Harness, { onValueChange });
		const history = recordStyles(thumb());

		await fireEvent.click(radio('Fast'));
		expect(radio('Fast')).toHaveAttribute('aria-checked', 'true');
		expect(onValueChange).toHaveBeenCalledWith('fast');

		const styles = await history();
		expect(styles.at(-1)).toContain('translate: 4px 4px');
		expect(styles.some((style) => style.includes('transition: none'))).toBe(false);
	});

	test('follows layout changes instantly', async () => {
		render(Harness);
		const history = recordStyles(thumb());
		boxes.balanced.width = 120;
		resize?.();
		const styles = await history();
		boxes.balanced.width = 90;

		expect(styles.some((style) => style.includes('transition: none'))).toBe(true);
		expect(thumb().style.width).toBe('120px');
		expect(thumb().style.transition).toBe('');
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
