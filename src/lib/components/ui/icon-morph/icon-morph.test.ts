import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import IconMorph from './icon-morph.svelte';
import IconMorphButton from './icon-morph-button.svelte';
import { interpolatePath, morphShapes } from './shapes.js';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
const d = (root: Element) => root.querySelector('path')?.getAttribute('d');

describe('interpolatePath', () => {
	test('eases every number between two paths of the same shape', () => {
		const between = interpolatePath('M0 0L10 10', 'M10 0L20 30');
		expect(between?.(0)).toBe('M0 0L10 10');
		expect(between?.(0.5)).toBe('M5 0L15 20');
		expect(between?.(1)).toBe('M10 0L20 30');
	});

	test('refuses paths that do not pair up', () => {
		expect(interpolatePath('M0 0L10 10', 'M0 0L10 10L5 5')).toBeNull();
		expect(interpolatePath('M0 0L10 10', 'M0 0H10')).toBeNull();
	});

	test('every built-in pair morphs', () => {
		for (const shape of Object.values(morphShapes)) {
			expect(interpolatePath(shape.off, shape.on)).not.toBeNull();
		}
	});
});

describe('IconMorph', () => {
	test('reshapes toward the other drawing instead of swapping', async () => {
		const { container, rerender } = render(IconMorph, { shape: 'playPause' });
		expect(d(container)).toBe(morphShapes.playPause.off);
		await rerender({ shape: 'playPause', morphed: true });
		await advance(100);
		const middle = d(container);
		expect(middle).not.toBe(morphShapes.playPause.off);
		expect(middle).not.toBe(morphShapes.playPause.on);
		await advance(1000);
		expect(d(container)).toBe(morphShapes.playPause.on);
	});

	test('turns the glyph when the shape asks for it', async () => {
		const { container, rerender } = render(IconMorph, { shape: 'menuClose' });
		const svg = container.querySelector('svg')!;
		expect(svg.style.getPropertyValue('--morph-rotate')).toBe('0deg');
		await rerender({ shape: 'menuClose', morphed: true });
		expect(svg.style.getPropertyValue('--morph-rotate')).toBe('90deg');
	});

	test('lands at once under reduced motion', async () => {
		vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
		const { container, rerender } = render(IconMorph, { shape: 'sendSent' });
		await rerender({ shape: 'sendSent', morphed: true });
		expect(d(container)).toBe(morphShapes.sendSent.on);
	});

	test('takes custom paths and swaps ones that cannot morph', async () => {
		const shape = { off: 'M4 4L20 20', on: 'M4 4H20' };
		const { container, rerender } = render(IconMorph, { shape });
		await rerender({ shape, morphed: true });
		await advance(1000);
		expect(d(container)).toBe('M4 4H20');
	});
});

describe('IconMorphButton', () => {
	test('keeps a fixed name while the pressed state carries the change', async () => {
		const onPressedChange = vi.fn();
		render(IconMorphButton, {
			shape: 'playPause',
			label: 'Play',
			captions: ['Play', 'Pause'],
			onPressedChange
		});
		const button = screen.getByRole('button', { name: 'Play' });
		expect(button).toHaveAttribute('aria-pressed', 'false');
		await fireEvent.click(button);
		expect(onPressedChange).toHaveBeenCalledWith(true);
		expect(screen.getByRole('button', { name: 'Play' })).toHaveAttribute('aria-pressed', 'true');
		expect(screen.getByText('Pause')).toHaveClass('opacity-100');
		expect(screen.getByText('Play')).toHaveClass('opacity-0');
	});

	test('follows the pressed prop and ignores clicks while disabled', async () => {
		const onPressedChange = vi.fn();
		const { rerender } = render(IconMorphButton, {
			shape: 'plusMinus',
			label: 'Show reasoning',
			disabled: true,
			onPressedChange
		});
		const button = screen.getByRole('button', { name: 'Show reasoning' });
		await fireEvent.click(button);
		expect(onPressedChange).not.toHaveBeenCalled();
		await rerender({ shape: 'plusMinus', label: 'Show reasoning', pressed: true });
		expect(button).toHaveAttribute('aria-pressed', 'true');
	});

	test('stops its frame loop when destroyed', async () => {
		const { unmount } = render(IconMorphButton, { shape: 'menuClose', label: 'Menu' });
		await fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
		unmount();
		expect(vi.getTimerCount()).toBe(0);
	});
});
