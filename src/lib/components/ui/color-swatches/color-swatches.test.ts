import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';

import ColorSwatches from './color-swatches.svelte';
import ColorSwatchesFlood from './color-swatches-flood.svelte';

const swatches = [
	{ name: 'Graphite', color: 'oklch(0.42 0.02 260)' },
	{ name: 'Clay', color: 'oklch(0.6 0.13 35)' },
	{ name: 'Ochre', color: 'oklch(0.78 0.12 80)', ink: 'black' }
];

describe('ColorSwatches', () => {
	test('is a named radio group with one checked, tabbable swatch', () => {
		render(ColorSwatches, { swatches, value: 'Clay', label: 'Assistant color' });
		expect(screen.getByRole('radiogroup', { name: 'Assistant color' })).toBeInTheDocument();
		const clay = screen.getByRole('radio', { name: 'Clay' });
		expect(clay).toBeChecked();
		expect(clay).toHaveAttribute('tabindex', '0');
		expect(screen.getByRole('radio', { name: 'Graphite' })).toHaveAttribute('tabindex', '-1');
	});

	test('falls back to the first swatch when the value matches none', () => {
		render(ColorSwatches, { swatches, label: 'Color' });
		expect(screen.getByRole('radio', { name: 'Graphite' })).toBeChecked();
	});

	test('clicking picks a swatch and reports its name', async () => {
		const onValueChange = vi.fn();
		render(ColorSwatches, { swatches, value: 'Graphite', label: 'Color', onValueChange });
		await fireEvent.click(screen.getByRole('radio', { name: 'Ochre' }));
		expect(onValueChange).toHaveBeenCalledWith('Ochre');
		expect(screen.getByRole('radio', { name: 'Ochre' })).toBeChecked();
	});

	test('arrow keys move focus and the choice together, wrapping, with Home and End', async () => {
		const onValueChange = vi.fn();
		render(ColorSwatches, { swatches, value: 'Graphite', label: 'Color', onValueChange });
		const graphite = screen.getByRole('radio', { name: 'Graphite' });
		graphite.focus();

		await fireEvent.keyDown(graphite, { key: 'ArrowLeft' });
		expect(onValueChange).toHaveBeenLastCalledWith('Ochre');
		expect(screen.getByRole('radio', { name: 'Ochre' })).toHaveFocus();

		await fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
		expect(onValueChange).toHaveBeenLastCalledWith('Graphite');

		await fireEvent.keyDown(document.activeElement!, { key: 'End' });
		expect(screen.getByRole('radio', { name: 'Ochre' })).toBeChecked();
		await fireEvent.keyDown(document.activeElement!, { key: 'Home' });
		expect(screen.getByRole('radio', { name: 'Graphite' })).toHaveFocus();
	});

	test('draws a single ring on the checked swatch and uses the given ink', async () => {
		const { container } = render(ColorSwatches, { swatches, value: 'Clay', label: 'Color' });
		expect(container.querySelectorAll('[data-slot="color-swatches-ring"]')).toHaveLength(1);
		await fireEvent.click(screen.getByRole('radio', { name: 'Ochre' }));
		const rings = container.querySelectorAll('[data-slot="color-swatches-ring"]');
		expect(rings).toHaveLength(1);
		expect(rings[0].parentElement).toBe(screen.getByRole('radio', { name: 'Ochre' }));
		expect(screen.getByRole('radio', { name: 'Ochre' }).style.color).toBe('black');
	});

	test('disabled blocks picking', async () => {
		const onValueChange = vi.fn();
		render(ColorSwatches, { swatches, label: 'Color', disabled: true, onValueChange });
		await fireEvent.click(screen.getByRole('radio', { name: 'Clay' }));
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('submits the picked name with a form', () => {
		const { container } = render(ColorSwatches, {
			swatches,
			value: 'Clay',
			label: 'Color',
			name: 'accent'
		});
		expect(container.querySelector('input[name="accent"]')).toHaveValue('Clay');
	});
});

describe('ColorSwatchesFlood', () => {
	const colors = (container: HTMLElement) =>
		[...container.querySelectorAll<HTMLElement>('[data-slot="color-swatches-flood"] > span')].map(
			(node) => node.style.backgroundColor
		);

	test('a finished pour leaves only the new color', async () => {
		// Without the Web Animations API every pour lands at once.
		const { container, rerender } = render(ColorSwatchesFlood, { color: 'red' });
		expect(colors(container)).toEqual(['red']);
		await rerender({ color: 'blue' });
		await rerender({ color: 'green' });
		expect(colors(container)).toEqual(['green']);
	});

	test('rapid picks keep the settled color under the pours still spreading', async () => {
		// Pours that never finish until told to, like a key held down.
		const running: Animation[] = [];
		const animate = vi.fn(() => {
			const animation = { cancel() {}, onfinish: null, currentTime: 0, playState: 'running' };
			running.push(animation as unknown as Animation);
			return animation;
		});
		Element.prototype.animate = animate as unknown as Element['animate'];
		try {
			const { container, rerender } = render(ColorSwatchesFlood, { color: 'red' });
			for (const color of ['blue', 'green', 'yellow', 'orange', 'purple']) {
				await rerender({ color });
			}
			const stack = colors(container);
			expect(stack[0]).toBe('red');
			expect(stack.at(-1)).toBe('purple');
			expect(stack.length).toBeLessThanOrEqual(4);

			// Once every pour lands, only the newest color is left.
			await vi.waitFor(() => expect(running.length).toBeGreaterThan(0));
			while (running.length) {
				const animation = running.shift()!;
				animation.onfinish?.(new Event('finish') as AnimationPlaybackEvent);
				await Promise.resolve();
			}
			await vi.waitFor(() => expect(colors(container)).toEqual(['purple']));
		} finally {
			// @ts-expect-error jsdom has no animate of its own
			delete Element.prototype.animate;
		}
	});
});
