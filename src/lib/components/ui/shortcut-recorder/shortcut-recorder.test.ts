import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import ShortcutRecorder from './shortcut-recorder.svelte';

// jsdom has no Web Animations API; Svelte transitions finish on the next microtask.
const nativeAnimate = Element.prototype.animate;
const nativeGetAnimations = Element.prototype.getAnimations;
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
	Element.prototype.getAnimations = () => [];
});

afterEach(() => {
	Element.prototype.animate = nativeAnimate;
	Element.prototype.getAnimations = nativeGetAnimations;
	vi.useRealTimers();
});

function setup(props: Record<string, unknown> = {}) {
	const onChange = vi.fn();
	const result = render(ShortcutRecorder, {
		label: 'Open command menu',
		value: ['Mod', 'K'],
		onChange,
		...props
	});
	const field = screen.getByRole('button', { name: /Open command menu shortcut/ });
	return { ...result, onChange, field };
}

describe('ShortcutRecorder', () => {
	test('names the field with its action, its shortcut, and how to change it', () => {
		const { field } = setup();
		expect(field).toHaveAccessibleName('Open command menu shortcut: Control K. Press to change.');
		expect(field).toHaveAttribute('aria-pressed', 'false');
		expect(field).toHaveTextContent('Ctrl');
		expect(field).toHaveTextContent('K');
	});

	test('records a new combination as the keys are held and saves it', async () => {
		const { field, onChange } = setup();
		await fireEvent.click(field);
		expect(field).toHaveAttribute('aria-pressed', 'true');
		expect(field).toHaveTextContent('Press keys');

		await fireEvent.keyDown(window, { key: 'Control', code: 'ControlLeft', ctrlKey: true });
		expect(field).toHaveTextContent('Ctrl');

		await fireEvent.keyDown(window, {
			key: 'P',
			code: 'KeyP',
			ctrlKey: true,
			shiftKey: true
		});
		expect(onChange).toHaveBeenCalledWith(['Mod', 'Shift', 'P']);
		expect(field).toHaveAttribute('aria-pressed', 'false');
		expect(field).toHaveAccessibleName(
			'Open command menu shortcut: Control Shift P. Press to change.'
		);
	});

	test('takes keys before the page can act on them while recording', async () => {
		const { field } = setup();
		const pageHandler = vi.fn();
		window.addEventListener('keydown', pageHandler);
		await fireEvent.click(field);
		await fireEvent.keyDown(window, { key: 'b', code: 'KeyB', ctrlKey: true });
		expect(pageHandler).not.toHaveBeenCalled();
		window.removeEventListener('keydown', pageHandler);
	});

	test('refuses a bare key and says which modifier to add', async () => {
		const { field, onChange } = setup();
		await fireEvent.click(field);
		await fireEvent.keyDown(window, { key: 'n', code: 'KeyN' });
		expect(onChange).not.toHaveBeenCalled();
		expect(screen.getByRole('status')).toHaveTextContent('Add Ctrl, Alt or Shift');
		expect(field).toHaveAttribute('aria-pressed', 'true');
	});

	test('refuses a combination another action already uses', async () => {
		const taken = vi.fn((combo: string[]) =>
			combo.join('+') === 'Mod+B' ? 'Toggle sidebar' : null
		);
		const { field, onChange } = setup({ taken });
		await fireEvent.click(field);
		await fireEvent.keyDown(window, { key: 'b', code: 'KeyB', ctrlKey: true });
		expect(onChange).not.toHaveBeenCalled();
		expect(screen.getByRole('status')).toHaveTextContent('Used by Toggle sidebar');
	});

	test('Escape cancels and Backspace clears', async () => {
		const { field, onChange } = setup();
		await fireEvent.click(field);
		await fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
		expect(field).toHaveAttribute('aria-pressed', 'false');
		expect(onChange).not.toHaveBeenCalled();

		await fireEvent.click(field);
		await fireEvent.keyDown(window, { key: 'Backspace', code: 'Backspace' });
		expect(onChange).toHaveBeenCalledWith([]);
		expect(field).toHaveTextContent('None');
	});

	test('stops recording when the pointer goes elsewhere', async () => {
		const { field } = setup();
		await fireEvent.click(field);
		await fireEvent.pointerDown(document.body);
		expect(field).toHaveAttribute('aria-pressed', 'false');
	});

	test('does not record while disabled', async () => {
		const { field } = setup({ disabled: true });
		expect(field).toBeDisabled();
	});
});
