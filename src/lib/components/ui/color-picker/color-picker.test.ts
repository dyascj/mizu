import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';

import ColorPicker from './color-picker.svelte';
import { fromHex, parseHex, toHex } from './color.js';

describe('color math', () => {
	test('round-trips hex through hsv, keeping alpha only when translucent', () => {
		const base = { h: 0, s: 0, v: 0, a: 1 };
		expect(toHex(fromHex('#5B8DEF', base)!)).toBe('#5B8DEF');
		expect(toHex(fromHex('0f766e80', base)!)).toBe('#0F766E80');
		expect(toHex(fromHex('#fff', base)!)).toBe('#FFFFFF');
		expect(parseHex('nope')).toBeNull();
	});

	test('grey keeps the hue it had', () => {
		expect(fromHex('#808080', { h: 200, s: 0.5, v: 0.5, a: 1 })!.h).toBe(200);
	});
});

describe('ColorPicker', () => {
	test('exposes the square and channels as named sliders with readable values', () => {
		render(ColorPicker, { value: '#FF0000' });
		const pad = screen.getByRole('slider', { name: 'Saturation and brightness' });
		expect(pad).toHaveAttribute('aria-valuetext', 'Saturation 100%, brightness 100%');
		expect(screen.getByRole('slider', { name: 'Hue' })).toHaveAttribute(
			'aria-valuetext',
			'0 degrees'
		);
		expect(screen.getByRole('slider', { name: 'Opacity' })).toHaveAttribute('aria-valuenow', '100');
		expect(screen.getByRole('textbox', { name: 'Hex color' })).toHaveValue('FF0000');
	});

	test('arrow keys move the square along its axes and commit on blur', async () => {
		const onValueChange = vi.fn();
		const onValueCommit = vi.fn();
		render(ColorPicker, { value: '#FF0000', onValueChange, onValueCommit });
		const pad = screen.getByRole('slider', { name: 'Saturation and brightness' });
		pad.focus();
		await fireEvent.keyDown(pad, { key: 'ArrowDown', shiftKey: true });
		expect(pad).toHaveAttribute('aria-valuetext', 'Saturation 100%, brightness 90%');
		await fireEvent.keyDown(pad, { key: 'ArrowLeft' });
		expect(pad).toHaveAttribute('aria-valuetext', 'Saturation 99%, brightness 90%');
		expect(onValueChange).toHaveBeenCalledTimes(2);
		expect(onValueCommit).not.toHaveBeenCalled();
		await fireEvent.blur(pad);
		expect(onValueCommit).toHaveBeenCalledTimes(1);
	});

	test('hue keys step by a degree, Home and End jump to the ends', async () => {
		const onValueChange = vi.fn();
		render(ColorPicker, { value: '#FF0000', onValueChange });
		const hue = screen.getByRole('slider', { name: 'Hue' });
		await fireEvent.keyDown(hue, { key: 'ArrowRight' });
		expect(hue).toHaveAttribute('aria-valuenow', '1');
		await fireEvent.keyDown(hue, { key: 'End' });
		expect(hue).toHaveAttribute('aria-valuenow', '360');
		await fireEvent.keyDown(hue, { key: 'Home' });
		expect(hue).toHaveAttribute('aria-valuenow', '0');
	});

	test('opacity writes an alpha pair into the hex', async () => {
		const onValueChange = vi.fn();
		render(ColorPicker, { value: '#FF0000', onValueChange });
		await fireEvent.keyDown(screen.getByRole('slider', { name: 'Opacity' }), { key: 'PageDown' });
		expect(onValueChange).toHaveBeenLastCalledWith('#FF0000E6');
	});

	test('the hex field applies on Enter and flags text that is not a color', async () => {
		const onValueCommit = vi.fn();
		const { container } = render(ColorPicker, { value: '#FF0000', onValueCommit });
		const input = screen.getByRole('textbox', { name: 'Hex color' });
		await fireEvent.focus(input);
		await fireEvent.input(input, { target: { value: 'zzz' } });
		await fireEvent.keyDown(input, { key: 'Enter' });
		expect(input).toHaveAttribute('aria-invalid', 'true');
		expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent(
			'Not a valid hex color'
		);

		await fireEvent.input(input, { target: { value: '0f766e' } });
		await fireEvent.keyDown(input, { key: 'Enter' });
		expect(input).toHaveAttribute('aria-invalid', 'false');
		expect(onValueCommit).toHaveBeenLastCalledWith('#0F766E');
	});

	test('leaving the field with broken text puts the real value back', async () => {
		render(ColorPicker, { value: '#FF0000' });
		const input = screen.getByRole('textbox', { name: 'Hex color' });
		await fireEvent.focus(input);
		await fireEvent.input(input, { target: { value: 'zz' } });
		await fireEvent.blur(input);
		expect(input).toHaveValue('FF0000');
		expect(input).toHaveAttribute('aria-invalid', 'false');
	});

	test('commits join the recent row, and a recent color applies without reordering', async () => {
		render(ColorPicker, { value: '#FF0000', recent: ['#00FF00', '#0000FF'] });
		const input = screen.getByRole('textbox', { name: 'Hex color' });
		await fireEvent.focus(input);
		await fireEvent.input(input, { target: { value: '0f766e' } });
		await fireEvent.keyDown(input, { key: 'Enter' });
		const names = () =>
			screen.getAllByRole('button', { name: /^Use / }).map((b) => b.getAttribute('aria-label'));
		expect(names()).toEqual(['Use #0F766E', 'Use #00FF00', 'Use #0000FF']);
		expect(screen.getByRole('button', { name: 'Use #0F766E' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);

		await fireEvent.click(screen.getByRole('button', { name: 'Use #0000FF' }));
		expect(names()).toEqual(['Use #0F766E', 'Use #00FF00', 'Use #0000FF']);
		expect(screen.getByRole('button', { name: 'Use #0000FF' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		expect(input).toHaveValue('0000FF');
	});

	test('hides opacity when alpha is off', () => {
		render(ColorPicker, { value: '#FF000080', alpha: false });
		expect(screen.queryByRole('slider', { name: 'Opacity' })).not.toBeInTheDocument();
		expect(screen.getByRole('textbox', { name: 'Hex color' })).toHaveValue('FF0000');
	});

	test('follows a value changed from outside', async () => {
		const { rerender } = render(ColorPicker, { value: '#FF0000' });
		await rerender({ value: '#00FF00' });
		expect(screen.getByRole('slider', { name: 'Hue' })).toHaveAttribute('aria-valuenow', '120');
	});

	test('leaving or entering an unedited hex keeps the precise channels', async () => {
		const onValueCommit = vi.fn();
		render(ColorPicker, { value: '#FF0000', onValueCommit });
		const hue = screen.getByRole('slider', { name: 'Hue' });
		await fireEvent.keyDown(hue, { key: 'End' });
		expect(hue).toHaveAttribute('aria-valuenow', '360');

		const input = screen.getByRole('textbox', { name: 'Hex color' });
		await fireEvent.focus(input);
		await fireEvent.keyDown(input, { key: 'Enter' });
		await fireEvent.input(input, { target: { value: 'ff0000' } });
		await fireEvent.blur(input);
		expect(hue).toHaveAttribute('aria-valuenow', '360');
		expect(onValueCommit).not.toHaveBeenCalled();
	});

	test('recent colors that differ only in case show once', async () => {
		render(ColorPicker, {
			value: '#FF0000',
			recent: ['#5b8def', '#5B8DEF', '#00FF00', '#00ff00']
		});
		const names = () =>
			screen.getAllByRole('button', { name: /^Use / }).map((b) => b.getAttribute('aria-label'));
		expect(names()).toEqual(['Use #5B8DEF', 'Use #00FF00']);

		const input = screen.getByRole('textbox', { name: 'Hex color' });
		await fireEvent.focus(input);
		await fireEvent.input(input, { target: { value: '0f766e' } });
		await fireEvent.keyDown(input, { key: 'Enter' });
		expect(names()).toEqual(['Use #0F766E', 'Use #5B8DEF', 'Use #00FF00']);
	});

	test('a drag after key nudges commits once, not again on blur', async () => {
		const onValueCommit = vi.fn();
		render(ColorPicker, { value: '#FF0000', onValueCommit });
		const hue = screen.getByRole('slider', { name: 'Hue' });
		hue.getBoundingClientRect = () => new DOMRect(0, 0, 220, 28);
		hue.focus();
		await fireEvent.keyDown(hue, { key: 'ArrowRight' });

		const pointer = { pointerId: 1, pointerType: 'mouse', button: 0, clientX: 110, clientY: 14 };
		await fireEvent.pointerDown(hue, pointer);
		await fireEvent.pointerUp(hue, pointer);
		expect(onValueCommit).toHaveBeenCalledTimes(1);
		expect(hue).toHaveAttribute('aria-valuenow', '180');

		await fireEvent.blur(hue);
		expect(onValueCommit).toHaveBeenCalledTimes(1);
	});
});
