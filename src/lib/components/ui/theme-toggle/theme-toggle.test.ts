import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';

import ThemeToggle from './theme-toggle.svelte';

const part = (button: HTMLElement, slot: string) =>
	button.querySelectorAll<SVGElement>(`[data-slot="theme-toggle-${slot}"]`);

describe('ThemeToggle', () => {
	test('is a toggle named Dark mode that starts on the sun', () => {
		render(ThemeToggle);
		const button = screen.getByRole('button', { name: 'Dark mode' });
		expect(button).toHaveAttribute('type', 'button');
		expect(button).toHaveAttribute('aria-pressed', 'false');
		expect(button).toHaveAttribute('data-state', 'light');
		expect(part(button, 'ray')).toHaveLength(8);
		expect(part(button, 'disc')[0].style.scale).toBe('0.5625');
	});

	test('reports the new mode and folds the sun into a moon', async () => {
		const onModeChange = vi.fn();
		render(ThemeToggle, { onModeChange });
		const button = screen.getByRole('button', { name: 'Dark mode' });
		await fireEvent.click(button);
		expect(onModeChange).toHaveBeenCalledWith('dark');
		expect(button).toHaveAttribute('aria-pressed', 'true');
		expect(part(button, 'disc')[0].style.scale).toBe('1');
		expect(part(button, 'bite')[0].style.translate).toBe('0 0');
		for (const ray of part(button, 'ray')) expect(ray.getAttribute('class')).toContain('opacity-0');

		await fireEvent.click(button);
		expect(onModeChange).toHaveBeenLastCalledWith('light');
		expect(button).toHaveAttribute('aria-pressed', 'false');
	});

	test('rays retract in dial order and return in reverse, a beat late', async () => {
		render(ThemeToggle);
		const button = screen.getByRole('button', { name: 'Dark mode' });
		const delays = () =>
			[...part(button, 'ray')].map((ray) => parseFloat(ray.style.getPropertyValue('--ray-delay')));
		const out = delays();
		expect(out[7]).toBeLessThan(out[0]);
		expect(out[7]).toBeGreaterThan(0);

		await fireEvent.click(button);
		const inward = delays();
		expect(inward[0]).toBe(0);
		expect(inward[7]).toBeGreaterThan(inward[0]);
	});

	test('follows the mode prop and has no effect on the page', async () => {
		const { rerender } = render(ThemeToggle, { mode: 'dark' });
		const button = screen.getByRole('button', { name: 'Dark mode' });
		expect(button).toHaveAttribute('aria-pressed', 'true');
		await rerender({ mode: 'light' });
		expect(button).toHaveAttribute('aria-pressed', 'false');
		await fireEvent.click(button);
		expect(document.documentElement.classList.contains('dark')).toBe(false);
	});

	test('takes a custom name and does nothing while disabled', async () => {
		const onModeChange = vi.fn();
		render(ThemeToggle, { label: 'Night theme', disabled: true, onModeChange });
		const button = screen.getByRole('button', { name: 'Night theme' });
		expect(button).toBeDisabled();
		await fireEvent.click(button);
		expect(onModeChange).not.toHaveBeenCalled();
	});
});
