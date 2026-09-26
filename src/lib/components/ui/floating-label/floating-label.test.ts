import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';

import FloatingLabel from './floating-label.svelte';

const validateEmail = (value: string) =>
	value.trim() === ''
		? 'Enter your email address.'
		: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
			? null
			: "That doesn't look like an email address.";

const live = (container: HTMLElement) =>
	container.querySelector('[aria-live="polite"]')?.textContent?.trim();

describe('FloatingLabel', () => {
	test('names the field with its label, spelled out once for screen readers', () => {
		const { container } = render(FloatingLabel, { label: 'Full name' });
		const input = screen.getByRole('textbox', { name: 'Full name' });
		expect(input).toHaveAttribute('type', 'text');
		const letters = container.querySelectorAll('label [aria-hidden="true"] > span');
		expect([...letters].map((letter) => letter.textContent).join('')).toBe('Full name');
	});

	test('floats while focused or filled, and settles back when empty', async () => {
		const { container } = render(FloatingLabel, { label: 'Full name' });
		const input = screen.getByRole('textbox', { name: 'Full name' });
		const label = container.querySelector('label')!;
		expect(label).not.toHaveAttribute('data-floated');

		await fireEvent.focus(input);
		expect(label).toHaveAttribute('data-floated');
		await fireEvent.input(input, { target: { value: 'Ada' } });
		await fireEvent.blur(input);
		expect(label).toHaveAttribute('data-floated');

		await fireEvent.focus(input);
		await fireEvent.input(input, { target: { value: '' } });
		await fireEvent.blur(input);
		expect(label).not.toHaveAttribute('data-floated');
	});

	test('lifts the first letter first and settles the last letter first', async () => {
		const { container } = render(FloatingLabel, { label: 'Email' });
		const delays = () =>
			[...container.querySelectorAll<HTMLElement>('label [aria-hidden="true"] > span')].map(
				(letter) => parseFloat(letter.style.transitionDelay)
			);
		const settling = delays();
		expect(settling[0]).toBeGreaterThan(settling[4]);

		await fireEvent.focus(screen.getByRole('textbox'));
		const rising = delays();
		expect(rising[0]).toBe(0);
		expect(rising[4]).toBeGreaterThan(rising[0]);
	});

	test('waits for the field to be left before validating, then follows every keystroke', async () => {
		const onValueChange = vi.fn();
		const { container } = render(FloatingLabel, {
			label: 'Email',
			type: 'email',
			validate: validateEmail,
			onValueChange
		});
		const input = screen.getByRole('textbox', { name: 'Email' });

		// Tabbing past an untouched field is not a mistake.
		await fireEvent.focus(input);
		await fireEvent.blur(input);
		expect(input).not.toHaveAttribute('aria-invalid');

		await fireEvent.focus(input);
		await fireEvent.input(input, { target: { value: 'ada@' } });
		expect(onValueChange).toHaveBeenLastCalledWith('ada@');
		expect(input).not.toHaveAttribute('aria-invalid');

		await fireEvent.blur(input);
		expect(input).toHaveAttribute('aria-invalid', 'true');
		expect(input).toHaveAccessibleDescription("That doesn't look like an email address.");
		expect(live(container)).toBe("That doesn't look like an email address.");

		await fireEvent.focus(input);
		await fireEvent.input(input, { target: { value: 'ada@example.com' } });
		expect(input).not.toHaveAttribute('aria-invalid');
		expect(live(container)).toBe('');
	});

	test('shows a check once the value passes, and drops it as soon as it does not', async () => {
		const { container } = render(FloatingLabel, { label: 'Email', validate: validateEmail });
		const input = screen.getByRole('textbox', { name: 'Email' });
		const check = () => container.querySelector('svg');

		await fireEvent.input(input, { target: { value: 'ada@example.com' } });
		await fireEvent.blur(input);
		expect(check()).toHaveClass('opacity-100');

		await fireEvent.input(input, { target: { value: 'ada@' } });
		expect(check()).toHaveClass('opacity-0');
		// Still not red until the field is left.
		expect(input).not.toHaveAttribute('aria-invalid');
	});

	test('shows an error from outside', () => {
		render(FloatingLabel, { label: 'Username', error: 'That name is taken.' });
		const input = screen.getByRole('textbox', { name: 'Username' });
		expect(input).toHaveAttribute('aria-invalid', 'true');
		expect(input).toHaveAccessibleDescription('That name is taken.');
	});

	test('passes attributes to the field', () => {
		render(FloatingLabel, { label: 'Email', name: 'email', autocomplete: 'email', type: 'email' });
		const input = screen.getByRole('textbox', { name: 'Email' });
		expect(input).toHaveAttribute('name', 'email');
		expect(input).toHaveAttribute('autocomplete', 'email');
		expect(input).toHaveAttribute('type', 'email');
	});
});
