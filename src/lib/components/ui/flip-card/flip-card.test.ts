import { fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';

import FlipCard from './flip-card.svelte';

const front = createRawSnippet(() => ({ render: () => '<p>Atlas 3</p>' }));
const back = createRawSnippet(() => ({ render: () => '<p>200K context</p>' }));

afterEach(() => vi.unstubAllGlobals());

describe('FlipCard', () => {
	test('shows the front and hides the back from assistive technology', () => {
		render(FlipCard, { front, back, frontLabel: 'Show specs' });
		expect(screen.getByRole('button', { name: 'Show specs' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Show front' })).not.toBeInTheDocument();
		expect(screen.getByText('200K context').parentElement).toHaveAttribute('aria-hidden', 'true');
		expect(screen.getByText('200K context').parentElement!.inert).toBe(true);
	});

	test('turns over, reports the new side, and moves focus to the face now showing', async () => {
		const onFlippedChange = vi.fn();
		render(FlipCard, { front, back, frontLabel: 'Show specs', onFlippedChange });
		const turn = screen.getByRole('button', { name: 'Show specs' });
		turn.focus();

		await fireEvent.click(turn);
		expect(onFlippedChange).toHaveBeenCalledWith(true);
		const home = screen.getByRole('button', { name: 'Show front' });
		expect(home).toHaveFocus();
		expect(screen.getByText('Atlas 3').parentElement!.inert).toBe(true);
		expect(screen.getByText('200K context').parentElement!.inert).toBe(false);

		await fireEvent.click(home);
		expect(onFlippedChange).toHaveBeenLastCalledWith(false);
		expect(screen.getByRole('button', { name: 'Show specs' })).toHaveFocus();
	});

	test('follows a controlled side', async () => {
		const { rerender } = render(FlipCard, { front, back, flipped: true });
		expect(screen.getByRole('button', { name: 'Show front' })).toBeInTheDocument();
		await rerender({ front, back, flipped: false });
		expect(screen.getByRole('button', { name: 'Show back' })).toBeInTheDocument();
	});

	test('reduced motion swaps the faces without turning', async () => {
		vi.stubGlobal('matchMedia', (query: string) => ({
			matches: query.includes('reduce'),
			addEventListener() {},
			removeEventListener() {}
		}));
		const { container } = render(FlipCard, { front, back });
		await fireEvent.click(screen.getByRole('button', { name: 'Show back' }));
		const body = container.querySelector(
			'[data-slot="flip-card"] > div:last-child > div'
		) as HTMLElement;
		expect(body.style.transform).toContain('rotateY(0.00deg)');
		expect(container.querySelector('[data-slot="flip-card"]')).toHaveAttribute('data-flipped');
	});

	test('pointer handlers passed by the caller still run', async () => {
		const onpointermove = vi.fn();
		const onpointerleave = vi.fn();
		const { container } = render(FlipCard, { front, back, onpointermove, onpointerleave });
		const card = container.querySelector('[data-slot="flip-card"]') as HTMLElement;
		await fireEvent.pointerMove(card, { pointerType: 'mouse', clientX: 10, clientY: 10 });
		await fireEvent.pointerLeave(card, { pointerType: 'mouse' });
		expect(onpointermove).toHaveBeenCalledOnce();
		expect(onpointerleave).toHaveBeenCalledOnce();
	});
});
