import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';

import DockFixture from './dock.spec.svelte';

afterEach(() => {
	vi.restoreAllMocks();
	vi.useRealTimers();
});

const caption = (name: string) =>
	screen.getByRole('button', { name }).parentElement!.querySelector('.mizu-dock-label')!;

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

	test('slots widen into free room beside the dock, and not past it', async () => {
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
		const width = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1000);
		const { unmount } = render(DockFixture);
		const slot = () => screen.getByRole('button', { name: 'Inbox' }).parentElement!;
		await fireEvent.pointerMove(screen.getByTestId('dock'), { pointerType: 'mouse', clientX: 22 });
		// Plenty of room: the slot takes the whole magnified width.
		expect(slot().style.width).toBe(`${44 * 1.6}px`);
		unmount();

		// A dock that already fills its parent would wrap if its slots grew.
		width.mockReturnValue(0);
		render(DockFixture);
		await fireEvent.pointerMove(screen.getByTestId('dock'), { pointerType: 'mouse', clientX: 22 });
		expect(screen.getByRole('button', { name: 'Inbox' }).style.scale).toBe('1.6');
		expect(slot().style.width).toBe('44px');
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

	test('launches an app that is not running once, then marks it running', async () => {
		const onLaunch = vi.fn();
		render(DockFixture, { running: false, onLaunch });
		const item = screen.getByRole('button', { name: 'Inbox' });

		await fireEvent.click(item);
		expect(onLaunch).toHaveBeenCalledTimes(1);
		expect(screen.getByRole('button', { name: 'Inbox, running' })).toBe(item);

		// Already running: a click just activates it.
		await fireEvent.click(item);
		expect(onLaunch).toHaveBeenCalledTimes(1);
	});

	test('plain tiles have no running light and never launch', async () => {
		render(DockFixture);
		await fireEvent.click(screen.getByRole('button', { name: 'Agents' }));
		expect(screen.getByRole('button', { name: 'Agents' })).toBeInTheDocument();
	});

	test('the first caption waits a beat, then neighbors swap in at once', async () => {
		vi.useFakeTimers();
		render(DockFixture);
		const inbox = screen.getByRole('button', { name: 'Inbox' });
		const agents = screen.getByRole('button', { name: 'Agents' });

		await fireEvent.pointerEnter(inbox, { pointerType: 'mouse' });
		expect(caption('Inbox')).toHaveAttribute('data-state', 'hidden');
		await vi.advanceTimersByTimeAsync(350);
		expect(caption('Inbox')).toHaveAttribute('data-state', 'visible');

		await fireEvent.pointerEnter(agents, { pointerType: 'mouse' });
		expect(caption('Agents')).toHaveAttribute('data-state', 'visible');
		expect(caption('Inbox')).toHaveAttribute('data-state', 'hidden');

		await fireEvent.pointerLeave(screen.getByTestId('dock'));
		expect(caption('Agents')).toHaveAttribute('data-state', 'hidden');
	});
});
