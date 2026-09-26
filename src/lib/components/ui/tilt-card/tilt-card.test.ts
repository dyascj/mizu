import { fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';

import TiltCard from './tilt-card.svelte';

function stubMedia(reduced: boolean) {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: query.includes('reduce') ? reduced : true,
		addEventListener() {},
		removeEventListener() {}
	}));
}

const face = createRawSnippet(() => ({ render: () => '<p>Assistant Pro</p>' }));
const frameOf = (card: HTMLElement) => card.parentElement!;

function mockBox(element: HTMLElement) {
	vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
		x: 0,
		y: 0,
		left: 0,
		top: 0,
		right: 200,
		bottom: 100,
		width: 200,
		height: 100,
		toJSON: () => ({})
	});
}

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('TiltCard', () => {
	test('renders its face and hides the light layers from assistive technology', () => {
		render(TiltCard, { children: face, 'data-testid': 'card' });
		const card = screen.getByTestId('card');
		expect(screen.getByText('Assistant Pro')).toBeInTheDocument();
		expect(card.querySelectorAll(':scope > [aria-hidden="true"]').length).toBe(3);
	});

	test('leaves out the glare when asked', () => {
		render(TiltCard, { children: face, glare: false, 'data-testid': 'card' });
		expect(screen.getByTestId('card').querySelectorAll('[aria-hidden="true"]').length).toBe(0);
	});

	test('leans toward a mouse and settles back when it leaves', async () => {
		stubMedia(false);
		render(TiltCard, { children: face, 'data-testid': 'card' });
		const card = screen.getByTestId('card');
		mockBox(frameOf(card));

		await fireEvent.pointerMove(frameOf(card), { pointerType: 'mouse', clientX: 200, clientY: 0 });
		await vi.waitFor(() =>
			expect(card.style.transform).toBe('perspective(800px) rotateX(12.00deg) rotateY(12.00deg)')
		);

		await fireEvent.pointerLeave(frameOf(card));
		await vi.waitFor(() =>
			expect(card.style.transform).toBe('perspective(800px) rotateX(0.00deg) rotateY(0.00deg)')
		);
	});

	test('holds still for touch and for reduced motion', async () => {
		stubMedia(false);
		const { unmount } = render(TiltCard, { children: face, 'data-testid': 'card' });
		let card = screen.getByTestId('card');
		mockBox(frameOf(card));
		await fireEvent.pointerMove(frameOf(card), { pointerType: 'touch', clientX: 200, clientY: 0 });
		expect(card.style.transform).toBe('');
		unmount();

		stubMedia(true);
		render(TiltCard, { children: face, 'data-testid': 'card' });
		card = screen.getByTestId('card');
		mockBox(frameOf(card));
		await fireEvent.pointerMove(frameOf(card), { pointerType: 'mouse', clientX: 200, clientY: 0 });
		expect(card.style.transform).toBe('');
	});
});
