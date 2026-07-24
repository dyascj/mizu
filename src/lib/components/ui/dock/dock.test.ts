import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';

import DockFixture from './dock.spec.svelte';

afterEach(() => {
	vi.restoreAllMocks();
});

describe('Dock', () => {
	test('magnifies for a fine pointer and resets on pointer leave', async () => {
		vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
			x: 0,
			y: 0,
			left: 0,
			top: 0,
			right: 44,
			bottom: 44,
			width: 44,
			height: 44,
			toJSON: () => ({})
		});
		render(DockFixture);
		const dock = screen.getByTestId('dock');
		const item = screen.getByRole('button', { name: 'Inbox' });

		await fireEvent.pointerMove(dock, { pointerType: 'mouse', clientX: 22 });
		expect(item.style.scale).toBe('1.6');
		await fireEvent.pointerLeave(dock);
		expect(item.style.scale).toBe('1');
	});

	test('ignores touch movement', async () => {
		render(DockFixture);
		const item = screen.getByRole('button', { name: 'Inbox' });

		await fireEvent.pointerMove(screen.getByTestId('dock'), {
			pointerType: 'touch',
			clientX: 22
		});
		expect(item.style.scale).toBe('1');
	});

	test('clamps invalid magnification before applying it', async () => {
		vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
			x: 0,
			y: 0,
			left: 0,
			top: 0,
			right: 44,
			bottom: 44,
			width: 44,
			height: 44,
			toJSON: () => ({})
		});
		render(DockFixture, { magnification: 10, distance: -2 });

		await fireEvent.pointerMove(screen.getByTestId('dock'), {
			pointerType: 'mouse',
			clientX: 22
		});
		expect(screen.getByRole('button', { name: 'Inbox' }).style.scale).toBe('3');
	});
});
