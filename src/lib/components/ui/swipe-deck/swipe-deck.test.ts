import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';

import Fixture from './swipe-deck.test.svelte';

const items = [
	{ id: 'a', title: 'Prefers metric units' },
	{ id: 'b', title: 'Wants short replies' },
	{ id: 'c', title: 'Ships with SvelteKit' },
	{ id: 'd', title: 'Cooks for two' },
	{ id: 'e', title: 'Works mornings' }
];

afterEach(() => vi.unstubAllGlobals());

function setup(props: { loop?: boolean; restart?: boolean; items?: typeof items } = {}) {
	const onSwipe = vi.fn();
	const result = render(Fixture, { items, onSwipe, ...props });
	const deck = screen.getByRole('group', { name: 'Suggestions' });
	return { ...result, deck, onSwipe };
}

/** The card the reader can reach: every other card is hidden and inert. */
const top = (deck: HTMLElement) =>
	deck.querySelector<HTMLElement>('article:not([aria-hidden="true"])');

/** A pointer event with a controlled time stamp, so release speed is predictable. */
function pointer(type: string, target: Element, clientX: number, timeStamp: number) {
	const event = new MouseEvent(type, { bubbles: true, clientX, button: 0 });
	Object.defineProperty(event, 'pointerId', { value: 1 });
	Object.defineProperty(event, 'timeStamp', { value: timeStamp });
	return fireEvent(target, event);
}

describe('SwipeDeck', () => {
	test('names the deck and exposes only the front card', () => {
		const { deck } = setup();
		expect(deck).toHaveAttribute('aria-roledescription', 'card deck');
		expect(deck).toHaveAttribute('tabindex', '0');
		expect(top(deck)).toHaveTextContent('Prefers metric units');
		// The front card plus three behind it; the rest wait off the render.
		expect(deck.querySelectorAll('article')).toHaveLength(4);
		expect(deck.querySelectorAll('article[aria-hidden="true"]')).toHaveLength(3);
	});

	test('arrow keys accept and reject, and the result is announced', async () => {
		const { deck, onSwipe, container } = setup();
		await fireEvent.keyDown(deck, { key: 'ArrowRight' });
		expect(onSwipe).toHaveBeenLastCalledWith(items[0], 'right');
		expect(top(deck)).toHaveTextContent('Wants short replies');
		expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent(
			'Accept: Prefers metric units. 4 left.'
		);

		await fireEvent.keyDown(deck, { key: 'ArrowLeft' });
		expect(onSwipe).toHaveBeenLastCalledWith(items[1], 'left');
		expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent(
			'Reject: Wants short replies. 3 left.'
		);
	});

	test('buttons do the same as the arrow keys', async () => {
		const { onSwipe } = setup();
		await fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
		expect(onSwipe).toHaveBeenLastCalledWith(items[0], 'left');
		await fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
		expect(onSwipe).toHaveBeenLastCalledWith(items[1], 'right');
	});

	test('a drag past the throw distance throws toward that side', async () => {
		const { deck, onSwipe } = setup();
		const card = top(deck)!;
		await pointer('pointerdown', card, 100, 0);
		await pointer('pointermove', card, 60, 200);
		await pointer('pointermove', card, -40, 400);
		expect(card.style.transform).toContain('translate(-140px');
		await pointer('pointerup', card, -40, 600);
		expect(onSwipe).toHaveBeenCalledWith(items[0], 'left');
	});

	test('a short, slow drag springs back without deciding', async () => {
		const { deck, onSwipe } = setup();
		const card = top(deck)!;
		await pointer('pointerdown', card, 100, 0);
		await pointer('pointermove', card, 150, 300);
		await pointer('pointerup', card, 150, 600);
		expect(onSwipe).not.toHaveBeenCalled();
		expect(top(deck)).toBe(card);
	});

	test('a quick flick throws even when it is short', async () => {
		const { deck, onSwipe } = setup();
		const card = top(deck)!;
		await pointer('pointerdown', card, 100, 0);
		await pointer('pointermove', card, 120, 10);
		await pointer('pointermove', card, 150, 40);
		await pointer('pointerup', card, 150, 50);
		expect(onSwipe).toHaveBeenCalledWith(items[0], 'right');
	});

	test('shows the empty state and disables the buttons once every card is gone', async () => {
		const { deck } = setup({ items: items.slice(0, 2) });
		await fireEvent.keyDown(deck, { key: 'ArrowRight' });
		await fireEvent.keyDown(deck, { key: 'ArrowRight' });
		expect(screen.getByText('All done')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Accept' })).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Reject' })).toBeDisabled();
	});

	test('a looping deck puts thrown cards back at the bottom', async () => {
		const { deck, onSwipe } = setup({ loop: true, items: items.slice(0, 2) });
		await fireEvent.keyDown(deck, { key: 'ArrowRight' });
		await fireEvent.keyDown(deck, { key: 'ArrowRight' });
		expect(top(deck)).toHaveTextContent('Prefers metric units');
		expect(onSwipe).toHaveBeenCalledTimes(2);
	});

	test('reduced motion skips the flying copy', async () => {
		vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
		const { deck } = setup();
		await fireEvent.keyDown(deck, { key: 'ArrowRight' });
		expect(deck.querySelector('.swipe-deck-flight')).toBeNull();
	});

	test('a button that throws the last card hands focus to the empty state', async () => {
		vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
		setup({ items: items.slice(0, 1), restart: true });
		const accept = screen.getByRole('button', { name: 'Accept' });
		accept.focus();
		await fireEvent.click(accept);
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(accept).toBeDisabled();
		expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Review again' }));
	});

	test('with nothing to focus in the empty state, focus lands on the deck', async () => {
		vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
		const { deck } = setup({ items: items.slice(0, 1) });
		const reject = screen.getByRole('button', { name: 'Reject' });
		reject.focus();
		await fireEvent.click(reject);
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(document.activeElement).toBe(deck);
	});
});
