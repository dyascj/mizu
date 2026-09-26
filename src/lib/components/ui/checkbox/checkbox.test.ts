import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';

import Checkbox from './checkbox.svelte';
import Harness from './checkbox.test.svelte';

const box = (name: string) => screen.getByRole('checkbox', { name });
const shown = () => screen.getByTestId('value').textContent;
const drawn = (path: Element | null) =>
	path?.getAttribute('class')?.includes('[stroke-dashoffset:0]');

describe('Checkbox', () => {
	test('is a checkbox that toggles and draws its check in', async () => {
		render(Checkbox, { 'aria-label': 'Share usage data' });
		const control = box('Share usage data');
		const check = control.querySelector('[data-slot="checkbox-check"]');
		expect(control).toHaveAttribute('aria-checked', 'false');
		expect(drawn(check)).toBe(false);

		await fireEvent.click(control);
		expect(control).toHaveAttribute('aria-checked', 'true');
		expect(drawn(check)).toBe(true);
		expect(control.querySelector('[data-slot="checkbox-fill"]')?.getAttribute('class')).toContain(
			'scale-100'
		);

		await fireEvent.keyDown(control, { key: ' ' });
		expect(control).toHaveAttribute('aria-checked', 'false');
		expect(drawn(check)).toBe(false);
	});

	test('reports a mixed state and draws a dash instead of the check', async () => {
		render(Checkbox, { 'aria-label': 'All tools', indeterminate: true });
		const control = box('All tools');
		expect(control).toHaveAttribute('aria-checked', 'mixed');
		expect(drawn(control.querySelector('[data-slot="checkbox-dash"]'))).toBe(true);
		expect(drawn(control.querySelector('[data-slot="checkbox-check"]'))).toBe(false);

		await fireEvent.click(control);
		expect(control).toHaveAttribute('aria-checked', 'true');
		expect(drawn(control.querySelector('[data-slot="checkbox-dash"]'))).toBe(false);
		expect(drawn(control.querySelector('[data-slot="checkbox-check"]'))).toBe(true);
	});
});

describe('Checkbox colors', () => {
	afterEach(() => vi.restoreAllMocks());

	// jsdom has no stylesheet; stand in for the box's state colors.
	function stubColors() {
		const colors: Record<string, string> = {
			checked: 'rgb(5, 150, 105)',
			unchecked: 'rgb(250, 250, 250)'
		};
		const real = window.getComputedStyle;
		vi.spyOn(window, 'getComputedStyle').mockImplementation((el, pseudo) => {
			const probe = el instanceof HTMLElement && el.style.visibility === 'hidden';
			const color = probe ? colors[el.dataset.state ?? ''] : undefined;
			return color ? ({ backgroundColor: color } as CSSStyleDeclaration) : real(el, pseudo);
		});
	}

	test("the fill inherits the box's state color, so a consumer's override shows", async () => {
		stubColors();
		render(Checkbox, {
			'aria-label': 'Share usage data',
			class: 'data-[state=checked]:bg-emerald-600'
		});
		const control = box('Share usage data');
		const fill = control.querySelector<HTMLElement>('[data-slot="checkbox-fill"]')!;
		expect(fill).toHaveClass('bg-inherit');
		expect(control).toHaveClass('data-[state=checked]:bg-emerald-600');

		await fireEvent.click(control);
		// While the fill grows in, the box holds its empty color underneath.
		expect(fill.style.backgroundColor).toBe('rgb(5, 150, 105)');
		expect(control.style.backgroundColor).toBe('rgb(250, 250, 250)');
		await fireEvent(fill, Object.assign(new Event('transitionend'), { propertyName: 'scale' }));
		expect(fill.style.backgroundColor).toBe('');
		expect(control.style.backgroundColor).toBe('');

		await fireEvent.click(control);
		// Shrinking away, the fill keeps the color it had.
		expect(fill.style.backgroundColor).toBe('rgb(5, 150, 105)');
		expect(control.style.backgroundColor).toBe('');
	});

	test('boxes in a group hold their colors the same way', async () => {
		stubColors();
		render(Harness, { value: [] });
		await fireEvent.click(box('mentions'));
		expect(box('mentions').style.backgroundColor).toBe('rgb(250, 250, 250)');
	});
});

describe('CheckboxGroup', () => {
	test('is a labelled group whose boxes toggle one at a time', async () => {
		const onValueChange = vi.fn();
		render(Harness, { onValueChange });
		expect(screen.getByRole('group', { name: 'Notifications' })).toBeInTheDocument();
		expect(box('comments')).toHaveAttribute('aria-checked', 'true');

		await fireEvent.click(box('followers'));
		expect(shown()).toBe('comments,followers');
		expect(onValueChange).toHaveBeenLastCalledWith(['comments', 'followers']);
	});

	test('shift-click fills the range from the last box changed', async () => {
		const onValueChange = vi.fn();
		render(Harness, { value: [], onValueChange });
		await fireEvent.click(box('mentions'));
		await fireEvent.click(box('digest'), { shiftKey: true });
		expect(shown()).toBe('mentions,followers,updates,digest');
		expect(onValueChange).toHaveBeenLastCalledWith(['mentions', 'followers', 'updates', 'digest']);
		for (const name of ['mentions', 'followers', 'updates', 'digest']) {
			expect(box(name)).toHaveAttribute('aria-checked', 'true');
		}
		expect(box('comments')).toHaveAttribute('aria-checked', 'false');
	});

	test('the pressed box decides the direction of the range', async () => {
		render(Harness, { value: ['comments', 'mentions', 'followers', 'updates'] });
		await fireEvent.click(box('updates'));
		expect(shown()).toBe('comments,mentions,followers');
		await fireEvent.click(box('mentions'), { shiftKey: true });
		expect(shown()).toBe('comments');
	});

	test('reads Shift from the press when a label forwards the click', async () => {
		render(Harness, { value: [] });
		await fireEvent.click(box('comments'));
		const label = screen.getByText('updates');
		await fireEvent.pointerDown(label, { shiftKey: true });
		// The forwarded click arrives without the modifier.
		await fireEvent.click(box('updates'));
		expect(shown()).toBe('comments,mentions,followers,updates');
	});

	test('Shift and Space selects a range from the keyboard', async () => {
		render(Harness, { value: [] });
		await fireEvent.keyDown(box('followers'), { key: ' ' });
		expect(shown()).toBe('followers');
		await fireEvent.keyDown(box('comments'), { key: ' ', shiftKey: true });
		expect(shown()).toBe('comments,mentions,followers');
	});

	test('skips disabled boxes inside a range', async () => {
		render(Harness, { value: [], disabled: ['followers'] });
		await fireEvent.click(box('comments'));
		await fireEvent.click(box('digest'), { shiftKey: true });
		expect(shown()).toBe('comments,mentions,updates,digest');
	});

	test('toggles only the pressed box when range selection is off', async () => {
		render(Harness, { value: [], rangeSelect: false });
		await fireEvent.click(box('comments'));
		await fireEvent.click(box('digest'), { shiftKey: true });
		expect(shown()).toBe('comments,digest');
	});
});
