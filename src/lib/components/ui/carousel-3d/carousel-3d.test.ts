import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Carousel3d from './carousel-3d.svelte';

const items = [
	{ title: 'Atlas 4', description: 'Deep reasoning' },
	{ title: 'Atlas 4 mini', description: 'Fast and cheap' },
	{ title: 'Atlas Vision', description: 'Reads images' },
	{ title: 'Atlas Voice', description: 'Talks back' },
	{ title: 'Atlas Code', description: 'Ships patches' }
];

function stubReducedMotion(reduce: boolean) {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: query.includes('reduce') ? reduce : false,
		media: query,
		addEventListener() {},
		removeEventListener() {}
	}));
}

beforeEach(() => {
	// Reduced motion makes the ring jump, so every move lands at once.
	stubReducedMotion(true);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

function setup(props: { index?: number } = {}) {
	const onIndexChange = vi.fn();
	const result = render(Carousel3d, { items, label: 'Models', onIndexChange, ...props });
	const stage = screen.getByRole('group', { name: 'Models' });
	const status = result.container.querySelector('[aria-live="polite"]') as HTMLElement;
	const cards = Array.from(stage.querySelectorAll<HTMLElement>('[data-carousel-card]'));
	return { ...result, stage, status, cards, onIndexChange };
}

describe('Carousel3d', () => {
	test('names the carousel and hides every card but the front one', () => {
		const { stage, status, cards } = setup();
		expect(stage).toHaveAttribute('aria-roledescription', 'carousel');
		expect(stage).toHaveAttribute('tabindex', '0');
		expect(cards.map((card) => card.getAttribute('aria-hidden'))).toEqual([
			'false',
			'true',
			'true',
			'true',
			'true'
		]);
		expect(status).toHaveTextContent('Atlas 4, card 1 of 5 01 / 05');
	});

	test('turns with the arrow keys and the buttons, wrapping around', async () => {
		const { stage, status, onIndexChange } = setup();
		await fireEvent.keyDown(stage, { key: 'ArrowRight' });
		expect(onIndexChange).toHaveBeenLastCalledWith(1);
		expect(status).toHaveTextContent('Atlas 4 mini, card 2 of 5');

		await fireEvent.keyDown(stage, { key: 'ArrowLeft' });
		await fireEvent.keyDown(stage, { key: 'ArrowLeft' });
		expect(onIndexChange).toHaveBeenLastCalledWith(4);
		expect(status).toHaveTextContent('Atlas Code, card 5 of 5');

		await fireEvent.click(screen.getByRole('button', { name: 'Next card' }));
		expect(onIndexChange).toHaveBeenLastCalledWith(0);
		await fireEvent.click(screen.getByRole('button', { name: 'Previous card' }));
		expect(onIndexChange).toHaveBeenLastCalledWith(4);
	});

	test('brings a clicked card to the front', async () => {
		const { stage, cards, onIndexChange } = setup();
		await fireEvent.pointerDown(cards[2], { button: 0, pointerId: 1, clientX: 100 });
		await fireEvent.pointerUp(stage, { pointerId: 1, clientX: 101 });
		expect(onIndexChange).toHaveBeenLastCalledWith(2);
		expect(cards[2]).toHaveAttribute('aria-hidden', 'false');
	});

	test('a drag turns the ring by one card per 180px', async () => {
		const { stage, onIndexChange } = setup();
		await fireEvent.pointerDown(stage, { button: 0, pointerId: 1, clientX: 400 });
		// Past the click slop, then a slow drag left of two cards.
		await fireEvent.pointerMove(stage, { pointerId: 1, clientX: 390 });
		await fireEvent.pointerMove(stage, { pointerId: 1, clientX: 390 - 360 });
		await new Promise((resolve) => setTimeout(resolve, 150));
		await fireEvent.pointerUp(stage, { pointerId: 1, clientX: 390 - 360 });
		expect(onIndexChange).toHaveBeenLastCalledWith(2);
	});

	test('follows an index set from outside and lays out flat for reduced motion', async () => {
		const { cards, rerender } = setup();
		expect(cards[1].style.transform).toBe('translateX(192.00px)');
		expect(cards[1].style.opacity).toBe('0.5');
		await rerender({ index: 3 });
		expect(cards[3]).toHaveAttribute('aria-hidden', 'false');
		expect(cards[3].style.transform).toBe('translateX(0.00px)');
	});

	test('stands the cards around a ring with full motion', () => {
		stubReducedMotion(false);
		const { cards } = setup();
		expect(cards[0].style.transform).toMatch(
			/^rotateY\(0\.000deg\) translateZ\([\d.]+px\) scale\(1\.0000\)$/
		);
		expect(cards[1].style.transform).toContain('rotateY(72.000deg)');
	});
});
