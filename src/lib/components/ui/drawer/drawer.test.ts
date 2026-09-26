import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Harness from './drawer.test.svelte';

beforeEach(() => {
	// vaul captures the pointer when a press lands on the drawer; jsdom cannot.
	Element.prototype.setPointerCapture ??= () => {};
	Element.prototype.releasePointerCapture ??= () => {};
	vi.stubGlobal(
		'matchMedia',
		vi.fn(() => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
	);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

const share = () => screen.getByRole('dialog', { name: 'Share' });

describe('Drawer', () => {
	test('a nested drawer dims the drawer behind it', async () => {
		render(Harness);
		await fireEvent.click(screen.getByRole('button', { name: 'Share chat' }));
		await screen.findByRole('dialog', { name: 'Share' });
		expect(share()).not.toHaveAttribute('data-nested-open');
		expect(share().className).toContain('data-nested-open:before:opacity-');

		await fireEvent.click(screen.getByRole('button', { name: 'Invite people' }));
		await screen.findByRole('dialog', { name: 'Invite people' });
		expect(share()).toHaveAttribute('data-nested-open');
	});

	test('pulled away from its edge, it gives a little and springs back', async () => {
		render(Harness);
		await fireEvent.click(screen.getByRole('button', { name: 'Share chat' }));
		const drawer = await screen.findByRole('dialog', { name: 'Share' });

		await fireEvent.pointerDown(screen.getByText('Anyone with the link can read.'), {
			pointerId: 1,
			button: 0,
			clientY: 400
		});
		await fireEvent.pointerMove(window, { pointerId: 1, clientY: 280 });
		// Half of the 36px cap after 120px of pull.
		expect(drawer.style.translate).toBe('0 -18px');
		await fireEvent.pointerMove(window, { pointerId: 1, clientY: -2000 });
		expect(parseFloat(drawer.style.translate.split(' ')[1])).toBeGreaterThan(-36);

		await act(() => fireEvent.pointerUp(window, { pointerId: 1 }));
		await vi.waitFor(() => expect(drawer.style.translate).toBe(''));
	});
});
