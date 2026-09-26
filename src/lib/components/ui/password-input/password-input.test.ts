import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import PasswordInput from './password-input.svelte';
import { passwordStrength } from './strength.js';

const nativeGetContext = HTMLCanvasElement.prototype.getContext;

beforeEach(() => {
	vi.useFakeTimers();
	// jsdom has no canvas; every character measures 8px wide.
	HTMLCanvasElement.prototype.getContext = (() => ({
		font: '',
		measureText: (text: string) => ({ width: text.length * 8 })
	})) as unknown as typeof HTMLCanvasElement.prototype.getContext;
});

afterEach(() => {
	HTMLCanvasElement.prototype.getContext = nativeGetContext;
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
const field = (container: HTMLElement) => container.querySelector('input')!;

describe('passwordStrength', () => {
	test('scores length first, then variety', () => {
		expect(passwordStrength('')).toBe(0);
		expect(passwordStrength('Ab1!')).toBe(1);
		expect(passwordStrength('abcdefgh')).toBe(1);
		expect(passwordStrength('abcdefg1')).toBe(2);
		expect(passwordStrength('abcdefG1')).toBe(3);
		expect(passwordStrength('abcdefghijK1')).toBe(4);
	});
});

describe('PasswordInput', () => {
	test('shows and hides the password with a pressed toggle, keeping its name', async () => {
		const onRevealedChange = vi.fn();
		const { container } = render(PasswordInput, { value: 'hunter2', onRevealedChange });
		const input = field(container);
		const toggle = screen.getByRole('button', { name: 'Show password' });
		expect(input).toHaveAttribute('type', 'password');
		expect(toggle).toHaveAttribute('aria-pressed', 'false');
		expect(toggle).toHaveAttribute('aria-controls', input.id);

		await fireEvent.click(toggle);
		expect(input).toHaveAttribute('type', 'text');
		expect(toggle).toHaveAttribute('aria-pressed', 'true');
		expect(toggle).toHaveAccessibleName('Show password');
		expect(onRevealedChange).toHaveBeenCalledWith(true);

		await fireEvent.click(toggle);
		expect(input).toHaveAttribute('type', 'password');
	});

	test('morphs the dots into letters, then hands the text back to the field', async () => {
		const { container } = render(PasswordInput, { value: 'abc' });
		const input = field(container);
		await fireEvent.click(screen.getByRole('button', { name: 'Show password' }));

		const glyphs = container.querySelectorAll<HTMLElement>('.pw-glyph');
		expect(glyphs).toHaveLength(3);
		expect(glyphs[2].style.getPropertyValue('--pw-from')).toBe('16px');
		expect(glyphs[2].style.getPropertyValue('--pw-to')).toBe('16px');
		expect(glyphs[0].closest('[aria-hidden="true"]')).not.toBeNull();
		expect(input).toHaveClass('text-transparent');

		await advance(500);
		expect(container.querySelector('.pw-glyph')).toBeNull();
		expect(input).not.toHaveClass('text-transparent');
	});

	test('typing cuts the morph short', async () => {
		const { container } = render(PasswordInput, { value: 'abc' });
		await fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
		await fireEvent.input(field(container), { target: { value: 'abcd' } });
		expect(container.querySelector('.pw-glyph')).toBeNull();
	});

	test('skips the morph under reduced motion', async () => {
		vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
		const { container } = render(PasswordInput, { value: 'abc' });
		await fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
		expect(container.querySelector('.pw-glyph')).toBeNull();
		expect(field(container)).toHaveAttribute('type', 'text');
	});

	test('warns about Caps Lock only while typing in the field', async () => {
		const { container } = render(PasswordInput, {});
		const input = field(container);
		const live = () =>
			[...container.querySelectorAll('[aria-live="polite"]')].map((node) => node.textContent);

		await fireEvent.focus(input);
		await fireEvent.keyDown(input, { key: 'A', modifierCapsLock: true });
		expect(live()).toContain('Caps Lock is on');
		expect(input.getAttribute('aria-describedby')).toContain('caps');

		await fireEvent.blur(input);
		expect(live()).not.toContain('Caps Lock is on');
		expect(input).not.toHaveAttribute('aria-describedby');

		await fireEvent.focus(input);
		await fireEvent.keyUp(input, { key: 'CapsLock', modifierCapsLock: false });
		expect(live()).not.toContain('Caps Lock is on');
	});

	test('meters strength and announces the verdict once typing pauses', async () => {
		const { container } = render(PasswordInput, { strength: true });
		const input = field(container);
		expect(input).toHaveAttribute('autocomplete', 'new-password');
		const live = () => container.querySelectorAll('[aria-live="polite"]')[1]?.textContent;

		await fireEvent.input(input, { target: { value: 'abc' } });
		await advance(300);
		expect(live()).toBe('');
		await advance(800);
		expect(live()).toBe('Password strength: Weak');

		await fireEvent.input(input, { target: { value: 'correct Horse 9' } });
		await advance(1100);
		expect(live()).toBe('Password strength: Strong');
	});

	test('ticks off requirements and describes the field with them', async () => {
		const { container } = render(PasswordInput, {
			requirements: [
				{ label: 'A number', test: (value: string) => /\d/.test(value) },
				{ label: '8 or more characters', test: (value: string) => value.length >= 8 }
			]
		});
		const input = field(container);
		const list = screen.getByRole('list');
		expect(input.getAttribute('aria-describedby')).toBe(list.id);
		const items = () => screen.getAllByRole('listitem').map((item) => item.textContent?.trim());
		expect(items()).toEqual(['A number, not met', '8 or more characters, not met']);

		await fireEvent.input(input, { target: { value: 'pass1' } });
		expect(items()).toEqual(['A number, met', '8 or more characters, not met']);
	});

	test('defaults to a sign-in password and passes attributes to the field', () => {
		const { container } = render(PasswordInput, { name: 'password', placeholder: 'Password' });
		const input = field(container);
		expect(input).toHaveAttribute('autocomplete', 'current-password');
		expect(input).toHaveAttribute('name', 'password');
		expect(input).toHaveAttribute('placeholder', 'Password');
	});

	test('passes its own input, key, focus, and blur handlers through', async () => {
		const oninput = vi.fn();
		const onkeydown = vi.fn();
		const onfocus = vi.fn();
		const onblur = vi.fn();
		const onValueChange = vi.fn();
		const { container } = render(PasswordInput, {
			oninput,
			onkeydown,
			onfocus,
			onblur,
			onValueChange
		});
		const input = field(container);
		await fireEvent.focus(input);
		await fireEvent.keyDown(input, { key: 'a' });
		await fireEvent.input(input, { target: { value: 'a' } });
		await fireEvent.blur(input);
		expect(oninput).toHaveBeenCalledTimes(1);
		expect(oninput.mock.calls[0][0]).toBeInstanceOf(Event);
		expect(onValueChange).toHaveBeenCalledWith('a');
		expect(onkeydown).toHaveBeenCalledTimes(1);
		expect(onfocus).toHaveBeenCalledTimes(1);
		expect(onblur).toHaveBeenCalledTimes(1);
	});

	test('marks the field invalid', () => {
		const { container } = render(PasswordInput, { invalid: true });
		expect(field(container)).toHaveAttribute('aria-invalid', 'true');
	});

	test('clears its timers when destroyed', async () => {
		const { container, unmount } = render(PasswordInput, { value: 'abc', strength: true });
		await fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
		expect(container.querySelector('.pw-glyph')).not.toBeNull();
		unmount();
		expect(vi.getTimerCount()).toBe(0);
	});
});
