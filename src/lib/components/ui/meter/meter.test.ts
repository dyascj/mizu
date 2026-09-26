import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Meter from './meter.svelte';

describe('Meter', () => {
	test('normalizes invalid ranges and clamps its exposed value', () => {
		render(Meter, { value: 200, min: 10, max: 0 });
		const meter = screen.getByRole('meter', { name: 'Meter' });

		expect(meter).toHaveAttribute('aria-valuemin', '10');
		expect(meter).toHaveAttribute('aria-valuemax', '11');
		expect(meter).toHaveAttribute('aria-valuenow', '11');
		expect(meter.firstElementChild).toHaveStyle({ width: '100%' });
	});

	test('formats the clamped display value', () => {
		render(Meter, {
			value: -10,
			min: 0,
			max: 100,
			showValue: true,
			format: (value) => `${value}%`
		});

		expect(screen.getByText('0%')).toBeInTheDocument();
	});
});

const usage = [
	{ id: 'chat', label: 'Chat', value: 14.2 },
	{ id: 'agents', label: 'Agents', value: 11.6 },
	{ id: 'embeddings', label: 'Embeddings', value: 6.3 },
	{ id: 'cache', label: 'Cache', value: 2.4 }
];
const gb = (v: number) => `${v.toFixed(1)} GB`;

describe('Meter segments', () => {
	const nativeAnimate = Element.prototype.animate;
	beforeEach(() => {
		// svelte/animate asks for running animations before it measures.
		Element.prototype.getAnimations ??= () => [];
		vi.useFakeTimers();
		Element.prototype.animate = function () {
			return {
				cancel() {},
				set onfinish(done: () => void) {
					queueMicrotask(done);
				}
			} as unknown as Animation;
		};
	});
	afterEach(() => {
		Element.prototype.animate = nativeAnimate;
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});
	const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

	test('exposes the sum as one meter with a readable total', () => {
		render(Meter, { segments: usage, max: 64, label: 'Tokens this month', format: gb });
		const meter = screen.getByRole('meter', { name: 'Tokens this month' });
		expect(meter).toHaveAttribute('aria-valuenow', '34.5');
		expect(meter).toHaveAttribute('aria-valuetext', '34.5 GB of 64.0 GB');
		expect(meter.children).toHaveLength(4);
		expect((meter.children[0] as HTMLElement).style.width).toMatch(/^22\.18/);
	});

	test('previews a slice on focus and pins it on click', async () => {
		render(Meter, { segments: usage, max: 64, format: gb });
		const agents = screen.getByRole('button', { name: /Agents/ });

		await fireEvent.focus(agents);
		await advance(400);
		expect(screen.getByText('Agents', { selector: 'p' })).toBeInTheDocument();
		const slices = screen.getByRole('meter').children as HTMLCollectionOf<HTMLElement>;
		expect(slices[0].style.opacity).toBe('0.3');
		expect(slices[1].style.opacity).toBe('1');

		await fireEvent.click(agents);
		expect(agents).toHaveAttribute('aria-pressed', 'true');
		await fireEvent.blur(agents);
		expect(slices[0].style.opacity).toBe('0.3');
	});

	test('counts the total down when a slice clears and announces it', async () => {
		const { container, rerender } = render(Meter, { segments: usage, max: 64, format: gb });
		const cleared = usage.map((s) => (s.id === 'cache' ? { ...s, value: 0 } : s));
		await rerender({ segments: cleared, max: 64, format: gb });

		expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '32.1');
		expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe(
			'Cache cleared, 32.1 GB of 64.0 GB used'
		);
		await advance(16);
		expect(screen.getByText(/GB$/, { selector: 'span.text-2xl' }).textContent).not.toBe('32.1 GB');
		await advance(2000);
		expect(screen.getByText('32.1 GB', { selector: 'span.text-2xl' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /Cache/ })).not.toBeInTheDocument();
	});
	test('releases the dimming when the pinned slice clears', async () => {
		const { rerender } = render(Meter, { segments: usage, max: 64, format: gb });
		await fireEvent.click(screen.getByRole('button', { name: /Cache/ }));
		const slices = screen.getByRole('meter').children as HTMLCollectionOf<HTMLElement>;
		expect(slices[0].style.opacity).toBe('0.3');

		const cleared = usage.map((s) => (s.id === 'cache' ? { ...s, value: 0 } : s));
		await rerender({ segments: cleared, max: 64, format: gb });
		for (const slice of Array.from(slices)) expect(slice.style.opacity).toBe('1');
		for (const button of screen.getAllByRole('button')) {
			expect(button.className).not.toContain('opacity-60');
		}
	});

	test('hands format rounded values while the total counts', async () => {
		const seen: number[] = [];
		const raw = (v: number) => {
			seen.push(v);
			return `${v} GB`;
		};
		const { rerender } = render(Meter, { segments: usage, max: 64, format: raw });
		const cleared = usage.map((s) => (s.id === 'cache' ? { ...s, value: 0 } : s));
		await rerender({ segments: cleared, max: 64, format: raw });
		await advance(48);
		const text = screen.getByText(/GB$/, { selector: 'span.text-2xl' }).textContent ?? '';
		expect(text).toMatch(/^\d+(\.\d)? GB$/);
		for (const v of seen) expect(Number(v.toFixed(1))).toBe(v);
	});
});
