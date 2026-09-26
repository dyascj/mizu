import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';

import Fixture from './spotlight-card.spec.svelte';

function box(left: number, top: number, width: number, height: number): DOMRect {
	return {
		x: left,
		y: top,
		left,
		top,
		right: left + width,
		bottom: top + height,
		width,
		height,
		toJSON: () => ({})
	};
}

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

/** The light paints once per frame. */
const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

describe('SpotlightCard', () => {
	test('renders its content and hides the light from assistive technology', () => {
		const { container } = render(Fixture);
		expect(screen.getByRole('heading', { name: 'Long context' })).toBeInTheDocument();
		const layers = container.querySelectorAll(
			'[data-slot="spotlight-card"] > [aria-hidden="true"]'
		);
		expect(layers.length).toBe(4);
	});

	test('a group lights every card in its own coordinates', async () => {
		render(Fixture);
		const first = screen.getByTestId('first');
		const second = screen.getByTestId('second');
		vi.spyOn(first, 'getBoundingClientRect').mockReturnValue(box(0, 0, 200, 100));
		vi.spyOn(second, 'getBoundingClientRect').mockReturnValue(box(212, 0, 200, 100));
		vi.spyOn(screen.getByTestId('icon').parentElement!, 'getBoundingClientRect').mockReturnValue(
			box(20, 20, 20, 20)
		);
		const group = screen.getByTestId('group');

		await fireEvent.pointerMove(group, { pointerType: 'mouse', clientX: 100, clientY: 30 });
		await frame();
		expect(group).toHaveAttribute('data-lit');
		expect(first.style.getPropertyValue('--spotlight-x')).toBe('100px');
		expect(second.style.getPropertyValue('--spotlight-x')).toBe('-112px');
		expect(second.style.getPropertyValue('--spotlight-y')).toBe('30px');
		// The lamp is to the right of the icon, so its shadow falls left.
		expect(parseFloat(first.style.getPropertyValue('--spotlight-shadow-x'))).toBeLessThan(0);

		await fireEvent.pointerLeave(group);
		expect(group).not.toHaveAttribute('data-lit');
		expect(first.style.getPropertyValue('--spotlight-shadow-x')).toBe('0px');
	});

	test('ignores touch, which has no hover to light anything with', async () => {
		render(Fixture);
		const group = screen.getByTestId('group');
		await fireEvent.pointerMove(group, { pointerType: 'touch', clientX: 10, clientY: 10 });
		expect(group).not.toHaveAttribute('data-lit');
	});

	test('a card on its own follows the cursor itself', async () => {
		render(Fixture, { grouped: false });
		const card = screen.getByTestId('alone');
		vi.spyOn(card, 'getBoundingClientRect').mockReturnValue(box(10, 10, 200, 100));

		await fireEvent.pointerMove(card, { pointerType: 'mouse', clientX: 60, clientY: 40 });
		await frame();
		expect(card).toHaveAttribute('data-lit');
		expect(card.style.getPropertyValue('--spotlight-x')).toBe('50px');
		expect(card.style.getPropertyValue('--spotlight-y')).toBe('30px');

		await fireEvent.pointerLeave(card);
		expect(card).not.toHaveAttribute('data-lit');
	});

	test('coalesces a burst of moves into one paint from the latest position', async () => {
		render(Fixture, { grouped: false });
		const card = screen.getByTestId('alone');
		const measure = vi.spyOn(card, 'getBoundingClientRect').mockReturnValue(box(0, 0, 200, 100));
		for (const clientX of [10, 20, 30]) {
			await fireEvent.pointerMove(card, { pointerType: 'mouse', clientX, clientY: 5 });
		}
		await frame();
		expect(measure).toHaveBeenCalledOnce();
		expect(card.style.getPropertyValue('--spotlight-x')).toBe('30px');
	});

	test('stays dark under reduced motion, like every pointer effect', async () => {
		vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
		render(Fixture);
		const group = screen.getByTestId('group');
		await fireEvent.pointerMove(group, { pointerType: 'mouse', clientX: 10, clientY: 10 });
		await frame();
		expect(group).not.toHaveAttribute('data-lit');
		expect(screen.getByTestId('first').style.getPropertyValue('--spotlight-x')).toBe('');
	});

	test('still calls pointer handlers passed by the caller', async () => {
		const onpointermove = vi.fn();
		const onpointerleave = vi.fn();
		render(Fixture, { grouped: false, onpointermove, onpointerleave });
		const card = screen.getByTestId('alone');
		await fireEvent.pointerMove(card, { pointerType: 'mouse', clientX: 10, clientY: 10 });
		await fireEvent.pointerLeave(card);
		expect(onpointermove).toHaveBeenCalledOnce();
		expect(onpointerleave).toHaveBeenCalledOnce();
	});
});
