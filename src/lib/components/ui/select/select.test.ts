import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Harness from './select.test.svelte';
import { scrollReach } from './scroll-reach.js';

beforeEach(() => {
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		}
	);
	Element.prototype.scrollIntoView ??= () => {};
	Element.prototype.hasPointerCapture ??= () => false;
	// jsdom has no layout: rows are 32px tall and the trigger sits at 200px.
	vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (
		this: HTMLElement
	) {
		const items = [...(this.parentElement?.querySelectorAll('[data-select-item]') ?? [])];
		return Math.max(items.indexOf(this), 0) * 32;
	});
	vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(32);
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

const mouse = { button: 0, pointerType: 'mouse', pointerId: 1 };

async function openWithPointer(at = { clientX: 20, clientY: 220 }) {
	const trigger = screen.getByRole('combobox', { name: 'Voice' });
	vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 200, 180, 40));
	await fireEvent.pointerDown(trigger, { ...mouse, ...at });
	return { trigger, list: await screen.findByRole('listbox') };
}

describe('Select', () => {
	test('opens item-aligned by default, with the current choice over the trigger', async () => {
		render(Harness);
		const { list } = await openWithPointer();
		expect(list).toHaveAttribute('data-position', 'item-aligned');
		// Sol is the third 32px row, so the panel starts two rows above the
		// trigger's row, shifted into the viewport margin if needed.
		expect(Number.parseFloat(list.style.top)).toBe(204 - 2 * 32);
		expect(list.style.transformOrigin).not.toBe('');
		expect(screen.getByRole('option', { name: 'Sol' })).toHaveAttribute('aria-selected', 'true');
	});

	test('falls back to popper placement when a side is given', async () => {
		render(Harness, { side: 'top' });
		const { list } = await openWithPointer();
		expect(list).toHaveAttribute('data-position', 'popper');
	});

	test('a click that ends on the aligned choice leaves the list open', async () => {
		render(Harness);
		const { trigger } = await openWithPointer();
		const sol = screen.getByRole('option', { name: 'Sol' });
		await fireEvent.pointerUp(sol, { ...mouse, clientX: 20, clientY: 220 });
		window.dispatchEvent(new PointerEvent('pointerup'));
		expect(trigger).toHaveAttribute('aria-expanded', 'true');
	});

	test('press, drag, and release picks the option under the pointer', async () => {
		render(Harness);
		const { trigger } = await openWithPointer();
		window.dispatchEvent(new PointerEvent('pointermove', { clientX: 20, clientY: 290 }));
		const wren = screen.getByRole('option', { name: 'Wren' });
		await fireEvent.pointerUp(wren, { ...mouse, clientX: 20, clientY: 290 });
		await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
		expect(trigger).toHaveTextContent('wren');
	});

	test('picks from the keyboard', async () => {
		render(Harness);
		const trigger = screen.getByRole('combobox', { name: 'Voice' });
		trigger.focus();
		await fireEvent.keyDown(trigger, { key: 'Enter' });
		await screen.findByRole('listbox');
		await fireEvent.keyDown(trigger, { key: 'ArrowDown' });
		await fireEvent.keyDown(trigger, { key: 'Enter' });
		await waitFor(() => expect(trigger).toHaveTextContent('wren'));
	});
});

describe('scrollReach', () => {
	/** A viewport whose content is `content` px tall inside `height` px. */
	function viewport(content: number, height: number) {
		const el = document.createElement('div');
		el.setAttribute('role', 'presentation');
		Object.defineProperty(el, 'scrollHeight', { configurable: true, get: () => content });
		Object.defineProperty(el, 'clientHeight', { configurable: true, get: () => height });
		return el;
	}

	test('puts a list that scrolls in reach of the keyboard, as a group of the listbox', () => {
		const el = viewport(352, 280);
		scrollReach(el);
		expect(el).toHaveAttribute('tabindex', '0');
		expect(el).toHaveAttribute('role', 'group');
	});

	test('leaves a list that fits out of the tab order', () => {
		const el = viewport(288, 288);
		scrollReach(el);
		expect(el).not.toHaveAttribute('tabindex');
		expect(el).toHaveAttribute('role', 'presentation');
	});
});
